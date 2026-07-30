"use client";

import { CardPayment, initMercadoPago } from "@mercadopago/sdk-react";
import {
  Check,
  CreditCard,
  LockKeyhole,
  PackageCheck,
  ShieldCheck,
  Tag,
  Truck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckoutOrderSummary } from "@/components/checkout/CheckoutOrderSummary";
import { CheckoutCouponField } from "@/components/checkout/CheckoutCouponField";
import { CheckoutProcessingOverlay } from "@/components/checkout/CheckoutProcessingOverlay";
import { CheckoutSuccessView } from "@/components/checkout/CheckoutSuccessView";
import { useCart } from "@/contexts/CartContext";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { normalizeCep } from "@/shared/schemas/address";
import type { CustomerAddress } from "@/shared/types/address";
import type {
  CardPaymentData,
  MercadoPagoPublicConfig,
} from "@/shared/types/mercadoPago";
import type {
  ShippingQuoteOption,
  ShippingQuoteResult,
} from "@/shared/types/melhorEnvio";
import type { Order, PaymentMethod } from "@/shared/types/order";

type AddressForm = {
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
};

function formatCepInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function formatCpfInput(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9)
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatPhoneInput(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const fieldClassName =
  "mt-1.5 min-h-12 w-full rounded-xl border border-line bg-cream px-3.5 text-base text-ink outline-none transition-[border-color,box-shadow,background-color] placeholder:text-ink-muted/60 focus:border-rose-gold focus:bg-white focus:shadow-[0_0_0_3px_rgba(183,110,121,0.12)]";
const fieldLabelClassName =
  "text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted";
const sectionClassName =
  "scroll-mt-24 rounded-2xl border border-line bg-cream/90 p-4 shadow-[0_16px_45px_rgba(44,36,27,0.045)] sm:p-6";

export function CheckoutPageClient() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useCustomerAuth();
  const { cart, loading: cartLoading, refresh, couponApplication, removeCoupon } =
    useCart();

  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );
  const [addressForm, setAddressForm] = useState<AddressForm>({
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
  });
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [mpConfig, setMpConfig] = useState<MercadoPagoPublicConfig | null>(
    null
  );
  const [shippingQuote, setShippingQuote] =
    useState<ShippingQuoteResult | null>(null);
  const [selectedShippingId, setSelectedShippingId] = useState<string | null>(
    null
  );
  const [shippingLoading, setShippingLoading] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    crypto.randomUUID()
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [polling, setPolling] = useState(false);
  const shippingSectionRef = useRef<HTMLElement | null>(null);
  const paymentSectionRef = useRef<HTMLElement | null>(null);
  const lastQuotedCep = useRef<string>("");

  const selectedShipping: ShippingQuoteOption | null = useMemo(() => {
    if (!shippingQuote || !selectedShippingId) return null;
    return (
      shippingQuote.options.find((o) => o.id === selectedShippingId) ?? null
    );
  }, [shippingQuote, selectedShippingId]);

  const cepDigits = normalizeCep(addressForm.cep);
  const hasShipping = Boolean(shippingQuote?.quoteId && selectedShippingId);
  const canFinish = hasShipping && Boolean(mpConfig?.enabled);
  const recipientComplete = Boolean(
    recipientName.trim() &&
      recipientEmail.trim() &&
      recipientPhone.replace(/\D/g, "").length >= 10 &&
      cpf.replace(/\D/g, "").length === 11
  );
  const discountAmount = couponApplication?.discountAmount ?? 0;
  const checkoutTotal = Math.max(
    0,
    cart.subtotal - discountAmount + (selectedShipping?.customPrice ?? 0)
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/conta/entrar?next=/checkout");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (cartLoading || completedOrder) return;
    if (cart.items.length === 0) {
      router.replace("/carrinho");
    }
  }, [cartLoading, cart.items.length, completedOrder, router]);

  useEffect(() => {
    if (!user) return;
    setRecipientName(profile?.fullName ?? "");
    setRecipientEmail(user.email ?? "");
    setRecipientPhone(profile?.phone ?? "");

    const supabase = createClient();
    void supabase
      .from("customer_addresses")
      .select("*")
      .eq("customer_id", user.id)
      .order("is_default", { ascending: false })
      .then(({ data }) => {
        const mapped = (data ?? []).map((row) => ({
          id: row.id as string,
          customerId: row.customer_id as string,
          label: row.label as string,
          cep: row.cep as string,
          rua: row.rua as string,
          numero: row.numero as string,
          complemento: (row.complemento as string) || null,
          bairro: row.bairro as string,
          cidade: row.cidade as string,
          estado: row.estado as string,
          isDefault: Boolean(row.is_default),
          createdAt: row.created_at as string,
          updatedAt: row.updated_at as string,
        }));
        setAddresses(mapped);
        const preferred =
          mapped.find((a) => a.isDefault) ?? mapped[0] ?? null;
        if (preferred) {
          setSelectedAddressId(preferred.id);
          setAddressForm({
            cep: formatCepInput(preferred.cep),
            rua: preferred.rua,
            numero: preferred.numero,
            complemento: preferred.complemento ?? "",
            bairro: preferred.bairro,
            cidade: preferred.cidade,
            estado: preferred.estado,
          });
        }
      });
  }, [user, profile]);

  useEffect(() => {
    void fetch("/api/mercado-pago/config")
      .then((res) => res.json())
      .then((data: MercadoPagoPublicConfig & { error?: string }) => {
        if (!data.enabled || !data.publicKey) {
          setMpConfig(null);
          return;
        }
        initMercadoPago(data.publicKey, { locale: "pt-BR" });
        setMpConfig(data);
        if (data.methods?.length) {
          setPaymentMethod(data.methods[0]);
        }
      })
      .catch(() => setMpConfig(null));
  }, []);

  useEffect(() => {
    if (!completedOrder) return;
    if (
      completedOrder.paymentStatus !== "pending" &&
      completedOrder.paymentStatus !== "processing"
    ) {
      setPolling(false);
      return;
    }
    setPolling(true);
    const timer = setInterval(() => {
      void fetch(`/api/orders/${completedOrder.id}`)
        .then((res) => res.json())
        .then((order: Order) => {
          if (order?.id) {
            setCompletedOrder(order);
            if (
              order.paymentStatus === "approved" ||
              order.paymentStatus === "rejected"
            ) {
              setPolling(false);
              if (order.paymentStatus === "approved") {
                void refresh();
              }
            }
          }
        })
        .catch(() => undefined);
    }, 4000);
    return () => clearInterval(timer);
  }, [completedOrder, refresh]);

  async function lookupCep(cepRaw: string) {
    const cep = normalizeCep(cepRaw);
    if (cep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data?.erro) return;
      setAddressForm((prev) => ({
        ...prev,
        cep: formatCepInput(cep),
        rua: data.logradouro || prev.rua,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
        estado: data.uf || prev.estado,
      }));
    } catch {
      // silencioso
    }
  }

  const quoteShipping = useCallback(async (cepOverride?: string) => {
    const toPostalCode = normalizeCep(cepOverride ?? addressForm.cep);
    if (toPostalCode.length !== 8) {
      setError("Informe um CEP válido para calcular o frete");
      return;
    }
    setError(null);
    setShippingLoading(true);
    setShippingQuote(null);
    setSelectedShippingId(null);
    try {
      const res = await fetch("/api/shipping/checkout-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toPostalCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao calcular frete");
      lastQuotedCep.current = toPostalCode;
      setShippingQuote(data);
      if (data.options?.[0]) {
        setSelectedShippingId(data.options[0].id);
      }
    } catch (err) {
      lastQuotedCep.current = "";
      setError(err instanceof Error ? err.message : "Erro ao calcular frete");
    } finally {
      setShippingLoading(false);
    }
  }, [addressForm.cep]);

  // Calcula frete automaticamente ao CEP completo (evita o usuário “esquecer” o botão)
  useEffect(() => {
    if (cepDigits.length !== 8) return;
    if (cepDigits === lastQuotedCep.current) return;
    if (shippingLoading) return;
    const timer = window.setTimeout(() => {
      void quoteShipping(cepDigits);
    }, 550);
    return () => window.clearTimeout(timer);
  }, [cepDigits, quoteShipping, shippingLoading]);

  async function submitCheckout(card?: CardPaymentData) {
    setError(null);
    if (!shippingQuote?.quoteId || !selectedShippingId) {
      setError(
        "Escolha uma opção de frete abaixo para continuar. O frete é calculado automaticamente pelo CEP."
      );
      shippingSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      if (cepDigits.length === 8) void quoteShipping(cepDigits);
      return;
    }
    if (!mpConfig?.enabled) {
      setError("Pagamento indisponível no momento");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        shippingAddress: {
          cep: normalizeCep(addressForm.cep),
          rua: addressForm.rua.trim(),
          numero: addressForm.numero.trim(),
          complemento: addressForm.complemento.trim() || undefined,
          bairro: addressForm.bairro.trim(),
          cidade: addressForm.cidade.trim(),
          estado: addressForm.estado.trim().toUpperCase(),
        },
        shipping: {
          quoteId: shippingQuote.quoteId,
          serviceId: selectedShippingId,
        },
        recipient: {
          name: recipientName.trim(),
          email: recipientEmail.trim(),
          phone: recipientPhone.replace(/\D/g, ""),
          document: cpf.replace(/\D/g, ""),
        },
        paymentMethod,
        idempotencyKey,
        payer: {
          identificationNumber: cpf.replace(/\D/g, ""),
        },
        card,
      };

      const res = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setIdempotencyKey(crypto.randomUUID());
        throw new Error(data.error ?? "Erro ao finalizar compra");
      }
      setCompletedOrder(data.order as Order);
      void refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao finalizar");
      setIdempotencyKey(crypto.randomUUID());
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || cartLoading || !user) {
    return (
      <div className="mx-auto max-w-6xl animate-pulse px-4 py-14 sm:px-6">
        <div className="h-8 w-48 bg-ivory" />
        <div className="mt-8 h-64 bg-ivory" />
      </div>
    );
  }

  if (completedOrder) {
    return (
      <CheckoutSuccessView order={completedOrder} polling={polling} />
    );
  }

  return (
    <>
      <CheckoutProcessingOverlay visible={submitting} />
      <div className="mx-auto max-w-6xl px-3 pb-44 pt-5 sm:px-6 sm:pt-8 lg:px-8 lg:py-14">
        <header className="mb-5 sm:mb-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <Link
                href="/carrinho"
                className="inline-flex items-center text-xs font-medium uppercase tracking-[0.14em] text-ink-muted transition-colors hover:text-rose-gold"
              >
                ← Voltar ao carrinho
              </Link>
              <h1 className="mt-2 font-display text-3xl font-light tracking-[0.04em] text-ink sm:text-4xl">
                Finalizar compra
              </h1>
            </div>
            <span className="hidden items-center gap-2 text-xs text-ink-muted sm:flex">
              <LockKeyhole className="size-4 text-rose-gold" aria-hidden />
              Ambiente seguro
            </span>
          </div>

          <ol
            className="mt-5 grid grid-cols-3 overflow-hidden rounded-xl border border-line bg-ivory/65"
            aria-label="Etapas do checkout"
          >
            {[
              { label: "Entrega", complete: hasShipping },
              { label: "Dados", complete: recipientComplete },
              { label: "Pagamento", complete: false },
            ].map((step, index) => (
              <li
                key={step.label}
                className="flex min-w-0 items-center justify-center gap-1.5 border-r border-line px-2 py-2.5 text-[10px] font-medium uppercase tracking-[0.08em] text-ink-muted last:border-r-0 sm:text-xs"
              >
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] ${
                    step.complete
                      ? "bg-rose-gold text-cream"
                      : "border border-line bg-cream text-ink-muted"
                  }`}
                >
                  {step.complete ? (
                    <Check className="size-3" aria-hidden />
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="truncate">{step.label}</span>
              </li>
            ))}
          </ol>
        </header>

        {error ? (
          <p
            className="mb-5 rounded-xl border border-rose-gold/40 bg-rose-gold/5 px-4 py-3 text-sm text-rose-gold"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
          <div className="order-2 min-w-0 space-y-4 lg:order-1 lg:space-y-6">
            {addresses.length > 0 ? (
              <section className={sectionClassName}>
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-ivory text-rose-gold">
                    <PackageCheck className="size-4.5" aria-hidden />
                  </span>
                  <div>
                    <h2 className="font-display text-xl font-light tracking-[0.04em] text-ink">
                      Usar endereço salvo
                    </h2>
                    <p className="text-xs text-ink-muted">
                      Selecione para preencher os dados de entrega.
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className="flex min-h-16 cursor-pointer gap-3 rounded-xl border border-line bg-ivory/35 px-3.5 py-3 text-sm transition-colors has-[:checked]:border-rose-gold has-[:checked]:bg-rose-gold/5"
                    >
                      <input
                        type="radio"
                        name="saved-address"
                        checked={selectedAddressId === address.id}
                        onChange={() => {
                          setSelectedAddressId(address.id);
                          setAddressForm({
                            cep: formatCepInput(address.cep),
                            rua: address.rua,
                            numero: address.numero,
                            complemento: address.complemento ?? "",
                            bairro: address.bairro,
                            cidade: address.cidade,
                            estado: address.estado,
                          });
                          lastQuotedCep.current = "";
                          setShippingQuote(null);
                          setSelectedShippingId(null);
                        }}
                        className="mt-1 accent-[var(--color-rose-gold)]"
                      />
                      <span className="min-w-0">
                        <span className="font-medium text-ink">
                          {address.label}
                        </span>
                        <br />
                        <span className="line-clamp-2 text-xs leading-relaxed text-ink-muted">
                          {address.rua}, {address.numero} — {address.bairro},{" "}
                          {address.cidade}/{address.estado}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            ) : null}

            <section ref={shippingSectionRef} className={sectionClassName}>
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ivory text-rose-gold">
                  <Truck className="size-4.5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-display text-xl font-light tracking-[0.04em] text-ink">
                      Entrega
                    </h2>
                    {hasShipping ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.1em] text-emerald-700">
                        <Check className="size-3.5" aria-hidden />
                        Frete selecionado
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    Preencha seu endereço para ver prazo e valor.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="sm:col-span-1">
                  <span className={fieldLabelClassName}>CEP</span>
                  <input
                    value={addressForm.cep}
                    onChange={(e) => {
                      const next = formatCepInput(e.target.value);
                      const digits = normalizeCep(next);
                      setAddressForm((p) => ({ ...p, cep: next }));
                      if (digits !== lastQuotedCep.current) {
                        lastQuotedCep.current = "";
                        setShippingQuote(null);
                        setSelectedShippingId(null);
                      }
                      if (digits.length === 8) void lookupCep(next);
                    }}
                    className={fieldClassName}
                    inputMode="numeric"
                    placeholder="00000-000"
                    autoComplete="postal-code"
                  />
                </label>
                <label>
                  <span className={fieldLabelClassName}>Número</span>
                  <input
                    value={addressForm.numero}
                    onChange={(e) =>
                      setAddressForm((p) => ({ ...p, numero: e.target.value }))
                    }
                    className={fieldClassName}
                  />
                </label>
                <label className="sm:col-span-2">
                  <span className={fieldLabelClassName}>Rua</span>
                  <input
                    value={addressForm.rua}
                    onChange={(e) =>
                      setAddressForm((p) => ({ ...p, rua: e.target.value }))
                    }
                    className={fieldClassName}
                  />
                </label>
                <label>
                  <span className={fieldLabelClassName}>Bairro</span>
                  <input
                    value={addressForm.bairro}
                    onChange={(e) =>
                      setAddressForm((p) => ({ ...p, bairro: e.target.value }))
                    }
                    className={fieldClassName}
                  />
                </label>
                <label>
                  <span className={fieldLabelClassName}>Complemento</span>
                  <input
                    value={addressForm.complemento}
                    onChange={(e) =>
                      setAddressForm((p) => ({
                        ...p,
                        complemento: e.target.value,
                      }))
                    }
                    className={fieldClassName}
                  />
                </label>
                <label>
                  <span className={fieldLabelClassName}>Cidade</span>
                  <input
                    value={addressForm.cidade}
                    onChange={(e) =>
                      setAddressForm((p) => ({ ...p, cidade: e.target.value }))
                    }
                    className={fieldClassName}
                  />
                </label>
                <label>
                  <span className={fieldLabelClassName}>UF</span>
                  <input
                    value={addressForm.estado}
                    onChange={(e) =>
                      setAddressForm((p) => ({
                        ...p,
                        estado: e.target.value.toUpperCase().slice(0, 2),
                      }))
                    }
                    className={fieldClassName}
                    maxLength={2}
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void quoteShipping()}
                  disabled={shippingLoading || cepDigits.length !== 8}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-rose-gold bg-rose-gold px-5 text-sm font-medium tracking-[0.08em] text-cream transition-[background-color,transform] active:scale-[0.99] disabled:opacity-40 sm:w-auto"
                >
                  {shippingLoading
                    ? "Calculando frete…"
                    : hasShipping
                      ? "Recalcular frete"
                      : "Calcular frete"}
                </button>
                {cepDigits.length < 8 ? (
                  <p className="text-xs leading-relaxed text-ink-muted sm:text-sm">
                    Digite o CEP completo para ver as opções de entrega.
                  </p>
                ) : shippingLoading ? (
                  <p className="text-xs text-ink-muted sm:text-sm">
                    Buscando transportadoras…
                  </p>
                ) : null}
              </div>

              {!hasShipping && !shippingLoading && cepDigits.length === 8 ? (
                <p className="mt-3 rounded-xl border border-rose-gold/30 bg-rose-gold/5 px-4 py-3 text-sm text-rose-gold">
                  Ainda sem frete selecionado. Aguarde o cálculo ou clique em
                  “Calcular frete” para continuar o pedido.
                </p>
              ) : null}

              {shippingQuote?.options?.length ? (
                <div className="mt-4 space-y-2">
                  <p className="text-xs uppercase tracking-[0.14em] text-ink-muted">
                    Escolha a entrega
                  </p>
                  {shippingQuote.options.map((option) => (
                    <label
                      key={option.id}
                      className="grid min-h-16 cursor-pointer grid-cols-[auto_1fr] items-start gap-x-3 rounded-xl border border-line bg-ivory/25 px-3.5 py-3 text-sm transition-colors has-[:checked]:border-rose-gold has-[:checked]:bg-rose-gold/5 sm:grid-cols-[1fr_auto] sm:items-center"
                    >
                      <span className="contents sm:flex sm:items-center sm:gap-3">
                        <input
                          type="radio"
                          name="shipping"
                          checked={selectedShippingId === option.id}
                          onChange={() => setSelectedShippingId(option.id)}
                          className="mt-1 accent-[var(--color-rose-gold)] sm:mt-0"
                        />
                        <span className="min-w-0">
                          <span className="block font-medium leading-snug text-ink">
                            {option.company}
                          </span>
                          <span className="mt-0.5 block text-xs text-ink-muted">
                            {option.name} ·{" "}
                            até {option.customDeliveryTime} dias úteis
                          </span>
                        </span>
                      </span>
                      <span className="col-start-2 mt-1 shrink-0 font-medium text-ink sm:col-auto sm:mt-0">
                        {option.customPrice === 0
                          ? "Grátis"
                          : formatPrice(option.customPrice)}
                      </span>
                    </label>
                  ))}
                </div>
              ) : null}
            </section>

            <section className={sectionClassName}>
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ivory text-rose-gold">
                  <UserRound className="size-4.5" aria-hidden />
                </span>
                <div>
                  <h2 className="font-display text-xl font-light tracking-[0.04em] text-ink">
                    Dados do destinatário
                  </h2>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    Usaremos estes dados para a entrega e o pagamento.
                  </p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className={fieldLabelClassName}>Nome completo</span>
                  <input
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className={fieldClassName}
                    autoComplete="name"
                  />
                </label>
                <label>
                  <span className={fieldLabelClassName}>E-mail</span>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className={fieldClassName}
                    autoComplete="email"
                  />
                </label>
                <label>
                  <span className={fieldLabelClassName}>Telefone</span>
                  <input
                    value={recipientPhone}
                    onChange={(e) =>
                      setRecipientPhone(formatPhoneInput(e.target.value))
                    }
                    className={fieldClassName}
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </label>
                <label className="sm:col-span-2">
                  <span className={fieldLabelClassName}>CPF</span>
                  <input
                    value={cpf}
                    onChange={(e) => setCpf(formatCpfInput(e.target.value))}
                    className={fieldClassName}
                    inputMode="numeric"
                  />
                </label>
              </div>
            </section>

            <section className={sectionClassName}>
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ivory text-rose-gold">
                  <Tag className="size-4.5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-xl font-light tracking-[0.04em] text-ink">
                    Cupom de desconto
                  </h2>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    Tem um código? Aplique antes de pagar.
                  </p>
                </div>
              </div>
              <div className="mt-5">
                <CheckoutCouponField />
              </div>
            </section>

            <section ref={paymentSectionRef} className={sectionClassName}>
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ivory text-rose-gold">
                  <CreditCard className="size-4.5" aria-hidden />
                </span>
                <div>
                  <h2 className="font-display text-xl font-light tracking-[0.04em] text-ink">
                    Pagamento
                  </h2>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    Escolha a forma de pagamento que preferir.
                  </p>
                </div>
              </div>
              {!hasShipping ? (
                <p className="mt-4 rounded-xl border border-line bg-ivory/60 px-4 py-3 text-sm text-ink-muted">
                  Complete a etapa de entrega (CEP + frete) para liberar o
                  pagamento.
                </p>
              ) : null}
              {!mpConfig?.enabled ? (
                <p className="mt-3 text-sm text-ink-muted">
                  Configure o Mercado Pago em{" "}
                  <Link href="/admin/integracoes" className="text-rose-gold">
                    Integrações
                  </Link>
                  .
                </p>
              ) : (
                <div
                  className={`mt-5 grid grid-cols-3 gap-2 ${!hasShipping ? "pointer-events-none opacity-40" : ""}`}
                >
                  {mpConfig.methods.map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`min-h-12 rounded-xl border px-2 text-sm font-medium transition-colors ${
                        paymentMethod === method
                          ? "border-rose-gold bg-rose-gold text-cream"
                          : "border-line text-ink hover:border-rose-gold"
                      }`}
                    >
                      {method === "pix"
                        ? "Pix"
                        : method === "boleto"
                          ? "Boleto"
                          : "Cartão"}
                    </button>
                  ))}
                </div>
              )}

              {paymentMethod === "credit_card" &&
              mpConfig?.enabled &&
              hasShipping ? (
                <div className="mt-5 min-w-0 overflow-x-auto rounded-xl border border-line bg-white p-2 sm:p-4">
                  <CardPayment
                    initialization={{
                      amount: checkoutTotal,
                    }}
                    onSubmit={async (formData) => {
                      const card: CardPaymentData = {
                        token: String(formData.token),
                        paymentMethodId: String(formData.payment_method_id),
                        installments: Number(formData.installments) || 1,
                        issuerId: formData.issuer_id
                          ? String(formData.issuer_id)
                          : undefined,
                      };
                      await submitCheckout(card);
                    }}
                  />
                </div>
              ) : null}

              {paymentMethod !== "credit_card" ? (
                <div className="mt-6 hidden space-y-3 lg:block">
                  <button
                    type="button"
                    disabled={submitting || !canFinish}
                    onClick={() => void submitCheckout()}
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-rose-gold px-7 text-sm font-medium tracking-[0.1em] text-cream transition-colors hover:bg-rose-gold-light disabled:opacity-40"
                  >
                    {submitting
                      ? "Processando…"
                      : !hasShipping
                        ? "Calcule o frete para finalizar"
                        : "Finalizar pedido"}
                  </button>
                  {!hasShipping ? (
                    <p className="text-xs text-ink-muted">
                      O botão libera assim que uma opção de frete estiver
                      selecionada.
                    </p>
                  ) : null}
                  <p className="flex items-center justify-center gap-2 text-xs text-ink-muted">
                    <ShieldCheck className="size-4 text-rose-gold" aria-hidden />
                    Pagamento processado com segurança.
                  </p>
                </div>
              ) : null}
            </section>
          </div>

          <CheckoutOrderSummary
            cart={cart}
            shippingAmount={
              selectedShipping ? selectedShipping.customPrice : null
            }
            discountAmount={discountAmount}
            couponCode={couponApplication?.code ?? null}
            onRemoveCoupon={
              couponApplication
                ? () => {
                    void removeCoupon();
                  }
                : undefined
            }
            shippingPending={!hasShipping}
            className="order-1 lg:order-2"
          />
        </div>
      </div>

      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-cream/95 px-3 pt-3 shadow-[0_-14px_40px_rgba(44,36,27,0.09)] backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto max-w-lg">
          <div className="mb-2 flex items-end justify-between gap-4 px-1">
            <span className="text-xs text-ink-muted">
              {hasShipping ? "Total com frete" : "Total sem frete"}
            </span>
            <span className="font-display text-xl font-medium tracking-[0.02em] text-ink">
              {formatPrice(checkoutTotal)}
            </span>
          </div>
          <button
            type="button"
            disabled={submitting || !canFinish}
            onClick={() => {
              if (paymentMethod === "credit_card") {
                paymentSectionRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
                return;
              }
              void submitCheckout();
            }}
            className="inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-rose-gold px-5 text-sm font-medium tracking-[0.08em] text-cream transition-[background-color,transform] active:scale-[0.99] disabled:opacity-40"
          >
            <LockKeyhole className="size-4" aria-hidden />
            {submitting
              ? "Processando…"
              : !hasShipping
                ? "Calcule o frete para continuar"
                : paymentMethod === "credit_card"
                  ? "Preencher dados do cartão"
                  : "Finalizar pedido"}
          </button>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-ink-muted">
            <ShieldCheck className="size-3.5 text-rose-gold" aria-hidden />
            Seus dados estão protegidos.
          </p>
        </div>
      </div>
    </>
  );
}
