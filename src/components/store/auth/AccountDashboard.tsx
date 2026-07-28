"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { normalizeCep } from "@/shared/schemas/address";
import {
  displayPhoneBr,
  formatPhoneBr,
  isValidPhoneBr,
  normalizePhoneBr,
} from "@/shared/lib/phoneBr";

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

type OrderRow = {
  id: string;
  status: string;
  payment_status: string;
  total_amount: number | string;
  created_at: string;
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
  const [tab, setTab] = useState<Tab>("perfil");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
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

  useEffect(() => {
    if (!loading && !user) router.replace("/conta/entrar");
  }, [loading, user, router]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName);
      setPhone(displayPhoneBr(profile.phone));
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    void (async () => {
      const [{ data: addr }, { data: ords }] = await Promise.all([
        supabase
          .from("customer_addresses")
          .select("*")
          .eq("customer_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("orders")
          .select("id, status, payment_status, total_amount, created_at")
          .eq("customer_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      setAddresses((addr as Address[]) ?? []);
      setOrders((ords as OrderRow[]) ?? []);
    })();
  }, [user]);

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
  const tabs: { id: Tab; label: string }[] = [
    { id: "perfil", label: "Perfil" },
    { id: "enderecos", label: "Endereços" },
    { id: "seguranca", label: "Segurança" },
    { id: "pedidos", label: "Pedidos" },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-rose-gold/40 bg-ivory font-display text-lg tracking-wide text-rose-gold">
            {initials(displayName)}
          </div>
          <div>
            <p className="font-display text-xs uppercase tracking-[0.35em] text-rose-gold">
              Conta
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

      <nav className="flex flex-wrap gap-2 border-b border-line pb-3">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setTab(item.id);
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
        <section className="border border-line bg-cream/40 p-5 sm:p-7">
          <h2 className="font-display text-xl font-light tracking-[0.06em] text-ink">
            Pedidos
          </h2>
          {orders.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">
              Você ainda não tem pedidos.{" "}
              <Link href="/catalogo" className="text-rose-gold">
                Ver catálogo
              </Link>
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {orders.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <div>
                    <p className="text-ink">
                      #{o.id.slice(0, 8).toUpperCase()} ·{" "}
                      {new Date(o.created_at).toLocaleDateString("pt-BR")}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {o.payment_status} · {o.status}
                    </p>
                  </div>
                  <p className="text-ink">
                    {formatPrice(Number(o.total_amount))}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
