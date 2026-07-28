"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";

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

export function AccountDashboard() {
  const { user, profile, loading, signOut, updateProfile } = useCustomerAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [addrForm, setAddrForm] = useState({
    label: "Principal",
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
  });

  useEffect(() => {
    if (!loading && !user) router.replace("/conta/entrar");
  }, [loading, user, router]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName);
      setPhone(profile.phone);
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
          .limit(10),
      ]);
      setAddresses((addr as Address[]) ?? []);
      setOrders((ords as OrderRow[]) ?? []);
    })();
  }, [user]);

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-3xl animate-pulse px-4 py-16">
        <div className="h-8 w-40 bg-ivory" />
        <div className="mt-8 h-40 bg-ivory" />
      </div>
    );
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await updateProfile({ fullName: fullName.trim(), phone: phone.trim() });
      setMessage("Dados salvos");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function addAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("customer_addresses")
      .insert({
        customer_id: user.id,
        ...addrForm,
        is_default: addresses.length === 0,
      })
      .select("*")
      .single();
    if (error) {
      setMessage(error.message);
      return;
    }
    setAddresses((prev) => [data as Address, ...prev]);
    setAddrForm({
      label: "Principal",
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

  return (
    <div className="mx-auto max-w-3xl space-y-12 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.35em] text-rose-gold">
            Conta
          </p>
          <h1 className="mt-3 font-display text-3xl font-light tracking-[0.06em] text-ink">
            Olá{profile?.fullName ? `, ${profile.fullName.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-2 text-sm text-ink-muted">{user.email}</p>
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

      {message ? (
        <p className="text-sm text-earth">{message}</p>
      ) : null}

      <section className="border border-line p-5 sm:p-6">
        <h2 className="font-display text-xl tracking-[0.06em] text-ink">
          Meus dados
        </h2>
        <form onSubmit={saveProfile} className="mt-5 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-[0.14em] text-earth">
              Nome
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-2 min-h-12 w-full border border-line bg-cream px-4 text-sm outline-none focus:border-rose-gold"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.14em] text-earth">
              Telefone
            </label>
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-2 min-h-12 w-full border border-line bg-cream px-4 text-sm outline-none focus:border-rose-gold"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="min-h-11 border border-rose-gold bg-rose-gold px-6 text-xs tracking-[0.14em] text-cream disabled:opacity-50"
          >
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </form>
      </section>

      <section className="border border-line p-5 sm:p-6">
        <h2 className="font-display text-xl tracking-[0.06em] text-ink">
          Endereços
        </h2>
        {addresses.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">Nenhum endereço ainda.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {addresses.map((a) => (
              <li
                key={a.id}
                className="flex items-start justify-between gap-3 border-b border-line/60 pb-3 text-sm"
              >
                <div>
                  <p className="font-medium text-ink">{a.label}</p>
                  <p className="text-ink-muted">
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

        <form onSubmit={addAddress} className="mt-6 grid gap-3 sm:grid-cols-2">
          {(
            [
              ["label", "Rótulo", "text"],
              ["cep", "CEP", "text"],
              ["rua", "Rua", "text"],
              ["numero", "Número", "text"],
              ["complemento", "Complemento", "text"],
              ["bairro", "Bairro", "text"],
              ["cidade", "Cidade", "text"],
              ["estado", "UF", "text"],
            ] as const
          ).map(([key, label, type]) => (
            <div key={key} className={key === "rua" ? "sm:col-span-2" : ""}>
              <label className="text-[10px] uppercase tracking-[0.14em] text-earth">
                {label}
              </label>
              <input
                required={key !== "complemento"}
                type={type}
                inputMode={key === "cep" || key === "numero" ? "numeric" : undefined}
                maxLength={key === "estado" ? 2 : undefined}
                value={addrForm[key]}
                onChange={(e) =>
                  setAddrForm((f) => ({ ...f, [key]: e.target.value }))
                }
                className="mt-1.5 min-h-11 w-full border border-line bg-cream px-3 text-sm outline-none focus:border-rose-gold"
              />
            </div>
          ))}
          <button
            type="submit"
            className="min-h-11 border border-line text-xs tracking-[0.14em] text-ink hover:border-rose-gold hover:text-rose-gold sm:col-span-2"
          >
            Adicionar endereço
          </button>
        </form>
      </section>

      <section className="border border-line p-5 sm:p-6">
        <h2 className="font-display text-xl tracking-[0.06em] text-ink">
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
    </div>
  );
}
