"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronRight,
  CreditCard,
  Package,
  Star,
  Truck,
} from "lucide-react";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { normalizeCep } from "@/shared/schemas/address";
import {
  countCustomerOrderShortcuts,
  customerOrderStatusLabel,
  filterCustomerOrders,
  type CustomerOrderFilter,
} from "@/shared/lib/orderLabels";
import {
  displayPhoneBr,
  formatPhoneBr,
  isValidPhoneBr,
  normalizePhoneBr,
} from "@/shared/lib/phoneBr";
import type { OrderSummary } from "@/shared/types/order";

type Address = {
  id: string;
  label: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  is_default: boolean;
};

type Tab = "perfil" | "enderecos" | "seguranca" | "pedidos";

function formatCepInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const ORDER_SHORTCUTS: {
  id: Exclude<CustomerOrderFilter, "all">;
  label: string;
  icon: typeof CreditCard;
}[] = [
  { id: "to_pay", label: "A pagar", icon: CreditCard },
  { id: "preparing", label: "Preparando", icon: Package },
  { id: "shipping", label: "A caminho", icon: Truck },
  { id: "review", label: "Avaliar", icon: Star },
];

export function AccountDashboard() {
  const {
    user,
    profile,
    loading,
    signOut,
    updateProfile,
    updatePassword,
  } = useCustomerAuth();
  const router = useRouter();
  const ordersSectionRef = useRef<HTMLElement | null>(null);
  const [tab, setTab] = useState<Tab>("perfil");
  const [orderFilter, setOrderFilter] = useState<CustomerOrderFilter>("all");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileSeed, setProfileSeed] = useState<typeof profile>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [addrForm, setAddrForm] = useState({
    label: "Casa",
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
  });
  const [savingAddress, setSavingAddress] = useState(false);

  const phoneDigits = normalizePhoneBr(phone);
  const phoneInvalid = phoneDigits.length > 0 && !isValidPhoneBr(phoneDigits);
  const passwordHint = useMemo(() => {
    if (!newPassword) return "";
    if (newPassword.length < 8) return "Use pelo menos 8 caracteres";
    return "";
  }, [newPassword]);

  const shortcutCounts = useMemo(
    () => countCustomerOrderShortcuts(orders),
    [orders]
  );
  const filteredOrders = useMemo(
    () => filterCustomerOrders(orders, orderFilter),
    [orders, orderFilter]
  );

  useEffect(() => {
    if (!loading && !user) router.replace("/conta/entrar");
  }, [loading, user, router]);

  if (profile !== profileSeed) {
    setProfileSeed(profile);
    if (profile) {
      setFullName(profile.fullName);
      setPhone(displayPhoneBr(profile.phone));
    }
  }

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    void (async () => {
      const { data: addr } = await supabase
        .from("customer_addresses")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });
      setAddresses((addr as Address[]) ?? []);
    })();

    void fetch("/api/orders/me")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Erro ao carregar pedidos");
        setOrders(Array.isArray(data) ? (data as OrderSummary[]) : []);
      })
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  }, [user]);

  function openOrders(filter: CustomerOrderFilter = "all") {
    setOrderFilter(filter);
    setTab("pedidos");
    setError(null);
    setMessage(null);
    requestAnimationFrame(() => {
      ordersSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  async function lookupCep(cepRaw: string) {
    const cep = normalizeCep(cepRaw);
    if (cep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data?.erro) return;
      setAddrForm((prev) => ({
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

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (phoneInvalid) {
      setError("Informe um telefone válido com DDD (10 ou 11 dígitos)");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        phone: phoneDigits,
      });
      setPhone(displayPhoneBr(phoneDigits));
      setMessage("Dados atualizados com sucesso");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (passwordHint) {
      setError(passwordHint);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("As senhas não conferem");
      return;
    }
    setSavingPassword(true);
    try {
      await updatePassword(newPassword);
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Senha alterada com sucesso");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao alterar senha");
    } finally {
      setSavingPassword(false);
    }
  }

  async function addAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setMessage(null);
    setSavingAddress(true);
    const supabase = createClient();
    const payload = {
      customer_id: user.id,
      label: addrForm.label.trim() || "Casa",
      cep: normalizeCep(addrForm.cep),
      rua: addrForm.rua.trim(),
      numero: addrForm.numero.trim(),
      complemento: addrForm.complemento.trim(),
      bairro: addrForm.bairro.trim(),
      cidade: addrForm.cidade.trim(),
      estado: addrForm.estado.trim().toUpperCase(),
      is_default: addresses.length === 0,
    };
    const { data, error: insertError } = await supabase
      .from("customer_addresses")
      .insert(payload)
      .select("*")
      .single();
    setSavingAddress(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setAddresses((prev) => [data as Address, ...prev]);
    setAddrForm({
      label: "Casa",
      cep: "",
      rua: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
    });
    setMessage("Endereço adicionado");
  }

  async function removeAddress(id: string) {
    const supabase = createClient();
    await supabase.from("customer_addresses").delete().eq("id", id);
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  }

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-3xl animate-pulse px-4 py-16">
        <div className="h-8 w-40 bg-ivory" />
        <div className="mt-8 h-40 bg-ivory" />
      </div>
    );
  }

  const displayName = fullName.trim() || profile?.fullName || "Cliente";
  const googleAvatar =
    typeof user.user_metadata.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : typeof user.user_metadata.picture === "string"
        ? user.user_metadata.picture
        : null;
  const tabs: { id: Tab; label: string }[] = [
    { id: "perfil", label: "Perfil" },
    { id: "enderecos", label: "Endereços" },
    { id: "seguranca", label: "Segurança" },
    { id: "pedidos", label: "Pedidos" },
  ];

  const shortcutCountMap: Record<
    Exclude<CustomerOrderFilter, "all">,
    number
  > = {
    to_pay: shortcutCounts.toPay,
    preparing: shortcutCounts.preparing,
    shipping: shortcutCounts.shipping,
    review: shortcutCounts.review,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:space-y-8 lg:px-8 lg:py-14">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-rose-gold/40 bg-ivory font-display text-lg tracking-wide text-rose-gold">
            {googleAvatar ? (
              <Image
                src={googleAvatar}
                alt={`Foto de ${displayName}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              initials(displayName)
            )}
          </div>
          <div>
            <p className="font-display text-xs uppercase tracking-[0.35em] text-rose-gold">
              Eu
            </p>
            <h1 className="mt-1 font-display text-3xl font-light tracking-[0.06em] text-ink">
              Olá, {displayName.split(" ")[0]}
            </h1>
            <p className="mt-1 text-sm text-ink-muted">{user.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={async () => {
            await signOut();
            router.push("/");
          }}
          className="text-xs tracking-wide text-ink-muted hover:text-rose-gold"
        >
          Sair
        </button>
      </header>

      <section className="overflow-hidden border border-line bg-gradient-to-br from-cream via-cream to-rose-gold/10">
        <button
          type="button"
          onClick={() => openOrders("all")}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-ivory/40"
        >
          <div>
            <p className="font-display text-lg tracking-[0.04em] text-ink">
              Minhas compras
            </p>
            <p className="mt-0.5 text-sm text-ink-muted">
              {ordersLoading
                ? "Carregando pedidos…"
                : orders.length === 0
                  ? "Você ainda não tem pedidos"
                  : `${orders.length} pedido${orders.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <ChevronRight className="size-5 text-rose-gold" strokeWidth={1.5} />
        </button>
        <div className="grid grid-cols-4 border-t border-line">
          {ORDER_SHORTCUTS.map((shortcut) => {
            const Icon = shortcut.icon;
            const count = shortcutCountMap[shortcut.id];
            return (
              <button
                key={shortcut.id}
                type="button"
                onClick={() => openOrders(shortcut.id)}
                className="flex flex-col items-center gap-1.5 px-1 py-4 text-center transition-colors hover:bg-ivory/50"
              >
                <span className="relative flex size-10 items-center justify-center rounded-full border border-rose-gold/25 bg-cream text-rose-gold">
                  <Icon className="size-4" strokeWidth={1.5} />
                  {count > 0 ? (
                    <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-rose-gold px-1 text-[9px] text-cream">
                      {count > 9 ? "9+" : count}
                    </span>
                  ) : null}
                </span>
                <span className="text-[10px] leading-tight tracking-[0.04em] text-ink-muted sm:text-[11px]">
                  {shortcut.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <nav className="flex flex-wrap gap-2 border-b border-line pb-3">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setTab(item.id);
              if (item.id === "pedidos") setOrderFilter("all");
              setError(null);
              setMessage(null);
            }}
            className={`min-h-10 px-4 text-sm tracking-[0.08em] transition-colors ${
              tab === item.id
                ? "border-b-2 border-rose-gold text-ink"
                : "text-ink-muted hover:text-rose-gold"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {message ? (
        <p className="border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="border border-rose-gold/30 bg-rose-gold/5 px-4 py-3 text-sm text-rose-gold">
          {error}
        </p>
      ) : null}

      {tab === "perfil" ? (
        <section className="border border-line bg-cream/40 p-5 sm:p-7">
          <h2 className="font-display text-xl font-light tracking-[0.06em] text-ink">
            Meus dados
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            CPF e endereço completo são pedidos só no checkout.
          </p>
          <form onSubmit={saveProfile} className="mt-6 space-y-4">
            <div>
              <label className="text-xs uppercase tracking-[0.14em] text-earth">
                Nome completo
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="mt-2 min-h-12 w-full border border-line bg-cream px-4 text-sm outline-none focus:border-rose-gold"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.14em] text-earth">
                E-mail
              </label>
              <input
                value={user.email ?? ""}
                disabled
                className="mt-2 min-h-12 w-full border border-line bg-ivory px-4 text-sm text-ink-muted"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.14em] text-earth">
                WhatsApp / telefone
              </label>
              <input
                type="tel"
                inputMode="tel"
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(formatPhoneBr(e.target.value))}
                className="mt-2 min-h-12 w-full border border-line bg-cream px-4 text-sm outline-none focus:border-rose-gold"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="min-h-12 border border-rose-gold bg-rose-gold px-7 text-xs tracking-[0.14em] text-cream disabled:opacity-50"
            >
              {saving ? "Salvando…" : "Salvar dados"}
            </button>
          </form>
        </section>
      ) : null}

      {tab === "enderecos" ? (
        <section className="space-y-8">
          <div className="border border-line bg-cream/40 p-5 sm:p-7">
            <h2 className="font-display text-xl font-light tracking-[0.06em] text-ink">
              Endereços salvos
            </h2>
            {addresses.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">
                Nenhum endereço ainda. Adicione um para agilizar o checkout.
              </p>
            ) : (
              <ul className="mt-5 space-y-4">
                {addresses.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-start justify-between gap-3 border-b border-line/60 pb-4 text-sm"
                  >
                    <div>
                      <p className="font-medium text-ink">
                        {a.label}
                        {a.is_default ? (
                          <span className="ml-2 text-[10px] uppercase tracking-wide text-rose-gold">
                            Padrão
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1 text-ink-muted">
                        {a.rua}, {a.numero}
                        {a.complemento ? ` — ${a.complemento}` : ""}
                      </p>
                      <p className="text-ink-muted">
                        {a.bairro} · {a.cidade}/{a.estado} · CEP {a.cep}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void removeAddress(a.id)}
                      className="text-xs text-ink-muted hover:text-rose-gold"
                    >
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border border-line bg-cream/40 p-5 sm:p-7">
            <h2 className="font-display text-xl font-light tracking-[0.06em] text-ink">
              Novo endereço
            </h2>
            <form
              onSubmit={addAddress}
              className="mt-5 grid gap-3 sm:grid-cols-2"
            >
              <div>
                <label className="text-[10px] uppercase tracking-[0.14em] text-earth">
                  Nome (ex.: Casa)
                </label>
                <input
                  required
                  value={addrForm.label}
                  onChange={(e) =>
                    setAddrForm((f) => ({ ...f, label: e.target.value }))
                  }
                  className="mt-1.5 min-h-11 w-full border border-line bg-cream px-3 text-sm outline-none focus:border-rose-gold"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.14em] text-earth">
                  CEP
                </label>
                <input
                  required
                  inputMode="numeric"
                  value={addrForm.cep}
                  onChange={(e) => {
                    const next = formatCepInput(e.target.value);
                    setAddrForm((f) => ({ ...f, cep: next }));
                    if (normalizeCep(next).length === 8) void lookupCep(next);
                  }}
                  className="mt-1.5 min-h-11 w-full border border-line bg-cream px-3 text-sm outline-none focus:border-rose-gold"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] uppercase tracking-[0.14em] text-earth">
                  Rua
                </label>
                <input
                  required
                  value={addrForm.rua}
                  onChange={(e) =>
                    setAddrForm((f) => ({ ...f, rua: e.target.value }))
                  }
                  className="mt-1.5 min-h-11 w-full border border-line bg-cream px-3 text-sm outline-none focus:border-rose-gold"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.14em] text-earth">
                  Número
                </label>
                <input
                  required
                  value={addrForm.numero}
                  onChange={(e) =>
                    setAddrForm((f) => ({ ...f, numero: e.target.value }))
                  }
                  className="mt-1.5 min-h-11 w-full border border-line bg-cream px-3 text-sm outline-none focus:border-rose-gold"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.14em] text-earth">
                  Complemento
                </label>
                <input
                  value={addrForm.complemento}
                  onChange={(e) =>
                    setAddrForm((f) => ({ ...f, complemento: e.target.value }))
                  }
                  className="mt-1.5 min-h-11 w-full border border-line bg-cream px-3 text-sm outline-none focus:border-rose-gold"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.14em] text-earth">
                  Bairro
                </label>
                <input
                  required
                  value={addrForm.bairro}
                  onChange={(e) =>
                    setAddrForm((f) => ({ ...f, bairro: e.target.value }))
                  }
                  className="mt-1.5 min-h-11 w-full border border-line bg-cream px-3 text-sm outline-none focus:border-rose-gold"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.14em] text-earth">
                  Cidade
                </label>
                <input
                  required
                  value={addrForm.cidade}
                  onChange={(e) =>
                    setAddrForm((f) => ({ ...f, cidade: e.target.value }))
                  }
                  className="mt-1.5 min-h-11 w-full border border-line bg-cream px-3 text-sm outline-none focus:border-rose-gold"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.14em] text-earth">
                  UF
                </label>
                <input
                  required
                  maxLength={2}
                  value={addrForm.estado}
                  onChange={(e) =>
                    setAddrForm((f) => ({
                      ...f,
                      estado: e.target.value.toUpperCase().slice(0, 2),
                    }))
                  }
                  className="mt-1.5 min-h-11 w-full border border-line bg-cream px-3 text-sm outline-none focus:border-rose-gold"
                />
              </div>
              <button
                type="submit"
                disabled={savingAddress}
                className="min-h-11 border border-rose-gold bg-rose-gold text-xs tracking-[0.14em] text-cream disabled:opacity-50 sm:col-span-2"
              >
                {savingAddress ? "Salvando…" : "Adicionar endereço"}
              </button>
            </form>
          </div>
        </section>
      ) : null}

      {tab === "seguranca" ? (
        <section className="border border-line bg-cream/40 p-5 sm:p-7">
          <h2 className="font-display text-xl font-light tracking-[0.06em] text-ink">
            Alterar senha
          </h2>
          <form onSubmit={savePassword} className="mt-6 space-y-4">
            <div>
              <label className="text-xs uppercase tracking-[0.14em] text-earth">
                Nova senha
              </label>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-2 min-h-12 w-full border border-line bg-cream px-4 text-sm outline-none focus:border-rose-gold"
              />
              {passwordHint ? (
                <p className="mt-1 text-xs text-ink-muted">{passwordHint}</p>
              ) : null}
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.14em] text-earth">
                Confirmar nova senha
              </label>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-2 min-h-12 w-full border border-line bg-cream px-4 text-sm outline-none focus:border-rose-gold"
              />
            </div>
            <button
              type="submit"
              disabled={savingPassword}
              className="min-h-12 border border-rose-gold bg-rose-gold px-7 text-xs tracking-[0.14em] text-cream disabled:opacity-50"
            >
              {savingPassword ? "Salvando…" : "Atualizar senha"}
            </button>
          </form>
        </section>
      ) : null}

      {tab === "pedidos" ? (
        <section
          ref={ordersSectionRef}
          className="border border-line bg-cream/40 p-5 sm:p-7"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-light tracking-[0.06em] text-ink">
                Pedidos
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                {orderFilter === "all"
                  ? "Todos os pedidos"
                  : ORDER_SHORTCUTS.find((s) => s.id === orderFilter)?.label}
              </p>
            </div>
            {orderFilter !== "all" ? (
              <button
                type="button"
                onClick={() => setOrderFilter("all")}
                className="text-xs tracking-[0.08em] text-rose-gold"
              >
                Ver todos
              </button>
            ) : null}
          </div>

          {ordersLoading ? (
            <div className="mt-5 space-y-3 animate-pulse">
              <div className="h-16 bg-ivory" />
              <div className="h-16 bg-ivory" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">
              {orders.length === 0 ? (
                <>
                  Você ainda não tem pedidos.{" "}
                  <Link href="/catalogo" className="text-rose-gold">
                    Ver catálogo
                  </Link>
                </>
              ) : (
                "Nenhum pedido neste filtro."
              )}
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {filteredOrders.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/conta/pedidos/${o.id}`}
                    className="flex items-start justify-between gap-3 py-3 text-sm transition-colors hover:bg-ivory/40"
                  >
                    <div className="min-w-0">
                      <p className="text-ink">
                        #{o.id.slice(0, 8).toUpperCase()} ·{" "}
                        {new Date(o.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {customerOrderStatusLabel(o)} · {o.itemCount}{" "}
                        {o.itemCount === 1 ? "item" : "itens"}
                      </p>
                      {o.trackingCode ? (
                        <p className="mt-1 text-xs text-ink-muted">
                          Rastreio: {o.trackingCode}
                        </p>
                      ) : null}
                      {orderFilter === "review" ? (
                        <p className="mt-1 text-[11px] text-rose-gold">
                          Toque para avaliar os produtos
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <p className="text-ink">{formatPrice(o.totalAmount)}</p>
                      <ChevronRight
                        className="size-4 text-ink-muted"
                        strokeWidth={1.5}
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
