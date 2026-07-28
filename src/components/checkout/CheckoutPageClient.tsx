"use client";

import { CardPayment, initMercadoPago } from "@mercadopago/sdk-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CheckoutOrderSummary } from "@/components/checkout/CheckoutOrderSummary";
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

export function CheckoutPageClient() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useCustomerAuth();
  const { cart, loading: cartLoading, refresh } = useCart();

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

  const selectedShipping: ShippingQuoteOption | null = useMemo(() => {
    if (!shippingQuote || !selectedShippingId) return null;
    return (
      shippingQuote.options.find((o) => o.id === selectedShippingId) ?? null
    );
  }, [shippingQuote, selectedShippingId]);

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

  async function quoteShipping() {
    setError(null);
    setShippingLoading(true);
    setShippingQuote(null);
    setSelectedShippingId(null);
    try {
      const res = await fetch("/api/shipping/checkout-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toPostalCode: normalizeCep(addressForm.cep),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao calcular frete");
      setShippingQuote(data);
      if (data.options?.[0]) {
        setSelectedShippingId(data.options[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao calcular frete");
    } finally {
      setShippingLoading(false);
    }
  }

  async function submitCheckout(card?: CardPaymentData) {
    setError(null);
    if (!shippingQuote?.quoteId || !selectedShippingId) {
      setError("Calcule e selecione o frete");
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
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <header className="mb-8">
          <p className="font-display text-xs uppercase tracking-[0.35em] text-rose-gold">
            Finalizar
          </p>
          <h1 className="mt-3 font-display text-3xl font-light tracking-[0.06em] text-ink">
            Checkout
          </h1>
        </header>

        {error ? (
          <p className="mb-6 border border-rose-gold/40 bg-rose-gold/5 px-4 py-3 text-sm text-rose-gold">
            {error}
          </p>
        ) : null}

        <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
          <div className="space-y-10">
            {addresses.length > 0 ? (
              <section>
                <h2 className="font-display text-xl font-light tracking-[0.06em] text-ink">
                  Endereço salvo
                </h2>
                <div className="mt-4 space-y-2">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className="flex cursor-pointer gap-3 border border-line px-4 py-3 text-sm has-[:checked]:border-rose-gold"
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
                          setShippingQuote(null);
                          setSelectedShippingId(null);
                        }}
                        className="mt-1 accent-[var(--color-rose-gold)]"
                      />
                      <span>
                        <span className="font-medium text-ink">
                          {address.label}
                        </span>
                        <br />
                        <span className="text-ink-muted">
                          {address.rua}, {address.numero} — {address.bairro},{" "}
                          {address.cidade}/{address.estado}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            ) : null}

            <section>
              <h2 className="font-display text-xl font-light tracking-[0.06em] text-ink">
                Entrega
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="sm:col-span-1">
                  <span className="text-xs uppercase tracking-[0.14em] text-ink-muted">
                    CEP
                  </span>
                  <input
                    value={addressForm.cep}
                    onChange={(e) => {
                      const next = formatCepInput(e.target.value);
                      setAddressForm((p) => ({ ...p, cep: next }));
                      if (normalizeCep(next).length === 8) void lookupCep(next);
                    }}
                    className="mt-1 w-full border border-line bg-cream px-3 py-2.5 text-sm outline-none focus:border-rose-gold"
                    inputMode="numeric"
                  />
                </label>
                <label>
                  <span className="text-xs uppercase tracking-[0.14em] text-ink-muted">
                    Número
                  </span>
                  <input
                    value={addressForm.numero}
                    onChange={(e) =>
                      setAddressForm((p) => ({ ...p, numero: e.target.value }))
                    }
                    className="mt-1 w-full border border-line bg-cream px-3 py-2.5 text-sm outline-none focus:border-rose-gold"
                  />
                </label>
                <label className="sm:col-span-2">
                  <span className="text-xs uppercase tracking-[0.14em] text-ink-muted">
                    Rua
                  </span>
                  <input
                    value={addressForm.rua}
                    onChange={(e) =>
                      setAddressForm((p) => ({ ...p, rua: e.target.value }))
                    }
                    className="mt-1 w-full border border-line bg-cream px-3 py-2.5 text-sm outline-none focus:border-rose-gold"
                  />
                </label>
                <label>
                  <span className="text-xs uppercase tracking-[0.14em] text-ink-muted">
                    Bairro
                  </span>
                  <input
                    value={addressForm.bairro}
                    onChange={(e) =>
                      setAddressForm((p) => ({ ...p, bairro: e.target.value }))
                    }
                    className="mt-1 w-full border border-line bg-cream px-3 py-2.5 text-sm outline-none focus:border-rose-gold"
                  />
                </label>
                <label>
                  <span className="text-xs uppercase tracking-[0.14em] text-ink-muted">
                    Complemento
                  </span>
                  <input
                    value={addressForm.complemento}
                    onChange={(e) =>
                      setAddressForm((p) => ({
                        ...p,
                        complemento: e.target.value,
                      }))
                    }
                    className="mt-1 w-full border border-line bg-cream px-3 py-2.5 text-sm outline-none focus:border-rose-gold"
                  />
                </label>
                <label>
                  <span className="text-xs uppercase tracking-[0.14em] text-ink-muted">
                    Cidade
                  </span>
                  <input
                    value={addressForm.cidade}
                    onChange={(e) =>
                      setAddressForm((p) => ({ ...p, cidade: e.target.value }))
                    }
                    className="mt-1 w-full border border-line bg-cream px-3 py-2.5 text-sm outline-none focus:border-rose-gold"
                  />
                </label>
                <label>
                  <span className="text-xs uppercase tracking-[0.14em] text-ink-muted">
                    UF
                  </span>
                  <input
                    value={addressForm.estado}
                    onChange={(e) =>
                      setAddressForm((p) => ({
                        ...p,
                        estado: e.target.value.toUpperCase().slice(0, 2),
                      }))
                    }
                    className="mt-1 w-full border border-line bg-cream px-3 py-2.5 text-sm outline-none focus:border-rose-gold"
                    maxLength={2}
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={() => void quoteShipping()}
                disabled={shippingLoading || normalizeCep(addressForm.cep).length !== 8}
                className="mt-4 inline-flex min-h-11 items-center justify-center border border-rose-gold px-5 text-sm tracking-[0.12em] text-rose-gold transition-colors hover:bg-rose-gold hover:text-cream disabled:opacity-40"
              >
                {shippingLoading ? "Calculando…" : "Calcular frete"}
              </button>

              {shippingQuote?.options?.length ? (
                <div className="mt-4 space-y-2">
                  {shippingQuote.options.map((option) => (
                    <label
                      key={option.id}
                      className="flex cursor-pointer items-center justify-between gap-3 border border-line px-4 py-3 text-sm has-[:checked]:border-rose-gold"
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping"
                          checked={selectedShippingId === option.id}
                          onChange={() => setSelectedShippingId(option.id)}
                          className="accent-[var(--color-rose-gold)]"
                        />
                        <span>
                          <span className="font-medium text-ink">
                            {option.company} — {option.name}
                          </span>
                          <br />
                          <span className="text-xs text-ink-muted">
                            até {option.customDeliveryTime} dias úteis
                          </span>
                        </span>
                      </span>
                      <span className="shrink-0 text-ink">
                        {option.customPrice === 0
                          ? "Grátis"
                          : formatPrice(option.customPrice)}
                      </span>
                    </label>
                  ))}
                </div>
              ) : null}
            </section>

            <section>
              <h2 className="font-display text-xl font-light tracking-[0.06em] text-ink">
                Destinatário
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="text-xs uppercase tracking-[0.14em] text-ink-muted">
                    Nome completo
                  </span>
                  <input
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="mt-1 w-full border border-line bg-cream px-3 py-2.5 text-sm outline-none focus:border-rose-gold"
                  />
                </label>
                <label>
                  <span className="text-xs uppercase tracking-[0.14em] text-ink-muted">
                    E-mail
                  </span>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="mt-1 w-full border border-line bg-cream px-3 py-2.5 text-sm outline-none focus:border-rose-gold"
                  />
                </label>
                <label>
                  <span className="text-xs uppercase tracking-[0.14em] text-ink-muted">
                    Telefone
                  </span>
                  <input
                    value={recipientPhone}
                    onChange={(e) =>
                      setRecipientPhone(formatPhoneInput(e.target.value))
                    }
                    className="mt-1 w-full border border-line bg-cream px-3 py-2.5 text-sm outline-none focus:border-rose-gold"
                    inputMode="tel"
                  />
                </label>
                <label className="sm:col-span-2">
                  <span className="text-xs uppercase tracking-[0.14em] text-ink-muted">
                    CPF
                  </span>
                  <input
                    value={cpf}
                    onChange={(e) => setCpf(formatCpfInput(e.target.value))}
                    className="mt-1 w-full border border-line bg-cream px-3 py-2.5 text-sm outline-none focus:border-rose-gold"
                    inputMode="numeric"
                  />
                </label>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-light tracking-[0.06em] text-ink">
                Pagamento
              </h2>
              {!mpConfig?.enabled ? (
                <p className="mt-3 text-sm text-ink-muted">
                  Configure o Mercado Pago em{" "}
                  <Link href="/admin/integracoes" className="text-rose-gold">
                    Integrações
                  </Link>
                  .
                </p>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  {mpConfig.methods.map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`min-h-11 border px-4 text-sm tracking-[0.1em] transition-colors ${
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

              {paymentMethod === "credit_card" && mpConfig?.enabled ? (
                <div className="mt-6">
                  <CardPayment
                    initialization={{
                      amount:
                        cart.subtotal + (selectedShipping?.customPrice ?? 0),
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
                <button
                  type="button"
                  disabled={submitting || !selectedShippingId || !mpConfig?.enabled}
                  onClick={() => void submitCheckout()}
                  className="mt-6 inline-flex min-h-12 w-full items-center justify-center bg-rose-gold px-7 text-sm tracking-[0.14em] text-cream transition-colors hover:bg-rose-gold-light disabled:opacity-40 sm:w-auto"
                >
                  {submitting ? "Processando…" : "Finalizar pedido"}
                </button>
              ) : null}
            </section>
          </div>

          <CheckoutOrderSummary
            cart={cart}
            shippingAmount={
              selectedShipping ? selectedShipping.customPrice : null
            }
          />
        </div>
      </div>
    </>
  );
}
