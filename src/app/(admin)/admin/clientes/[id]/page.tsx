"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminShell, RequireAdmin } from "@/components/admin/AdminShell";
import {
  AdminAlert,
  AdminButton,
  AdminField,
  AdminInput,
  AdminPanel,
  AdminSpinner,
} from "@/components/admin/ui";
import { formatPrice } from "@/lib/utils";
import type { AdminCustomerDetail } from "@/shared/types/customer";

export default function AdminCustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<AdminCustomerDetail | null>(null);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!params.id) return;
    void fetch(`/api/admin/customers/${params.id}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Erro ao carregar");
        setCustomer(data);
        setForm({
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
        });
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Erro ao carregar")
      )
      .finally(() => setLoading(false));
  }, [params.id]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/customers/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Erro ao salvar");
      setCustomer(data);
      setForm({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
      });
      setMessage("Dados do cliente atualizados.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <RequireAdmin>
      <AdminShell
        title={customer?.fullName || "Cliente"}
        description="Perfil, endereços e histórico de pedidos."
        actions={
          <Link
            href="/admin/clientes"
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Voltar
          </Link>
        }
      >
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <AdminSpinner /> Carregando…
          </div>
        ) : !customer ? (
          <AdminAlert>{error || "Cliente não encontrado"}</AdminAlert>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            <AdminPanel title="Dados do perfil">
              <form className="space-y-4" onSubmit={save}>
                <AdminField label="Nome completo">
                  <AdminInput
                    required
                    value={form.fullName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        fullName: event.target.value,
                      }))
                    }
                  />
                </AdminField>
                <AdminField
                  label="E-mail"
                  hint="A alteração é aplicada diretamente à conta de acesso."
                >
                  <AdminInput
                    required
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                  />
                </AdminField>
                <AdminField label="Telefone">
                  <AdminInput
                    value={form.phone}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                  />
                </AdminField>
                {error ? <AdminAlert>{error}</AdminAlert> : null}
                {message ? (
                  <AdminAlert tone="success">{message}</AdminAlert>
                ) : null}
                <AdminButton disabled={saving}>
                  {saving ? "Salvando…" : "Salvar alterações"}
                </AdminButton>
              </form>
            </AdminPanel>

            <AdminPanel
              title="Resumo"
              description={`Cliente desde ${new Date(customer.createdAt).toLocaleDateString("pt-BR")}`}
            >
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-zinc-500">Pedidos</dt>
                  <dd className="mt-1 text-xl font-semibold">
                    {customer.orderCount}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Total pago</dt>
                  <dd className="mt-1 text-xl font-semibold">
                    {formatPrice(customer.totalSpent)}
                  </dd>
                </div>
              </dl>
              <h3 className="mt-6 text-sm font-semibold">Endereços</h3>
              {customer.addresses.length ? (
                <ul className="mt-2 space-y-3 text-sm text-zinc-600">
                  {customer.addresses.map((address) => (
                    <li
                      key={address.id}
                      className="rounded-xl border border-zinc-200 p-3"
                    >
                      <p className="font-medium text-zinc-900">
                        {address.label}
                        {address.isDefault ? " · Principal" : ""}
                      </p>
                      <p className="mt-1">
                        {address.rua}, {address.numero}
                        {address.complemento
                          ? ` — ${address.complemento}`
                          : ""}
                        <br />
                        {address.bairro} · {address.cidade}/{address.estado}
                        <br />
                        CEP {address.cep}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-zinc-500">
                  Nenhum endereço salvo.
                </p>
              )}
            </AdminPanel>

            <AdminPanel title="Pedidos" className="lg:col-span-2">
              {customer.orders.length ? (
                <div className="overflow-x-auto">
                  <table className="admin-table min-w-full">
                    <thead>
                      <tr>
                        <th>Pedido</th>
                        <th>Status</th>
                        <th>Itens</th>
                        <th>Total</th>
                        <th>Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customer.orders.map((order) => (
                        <tr key={order.id}>
                          <td>
                            <Link
                              href={`/admin/pedidos/${order.id}`}
                              className="font-medium hover:underline"
                            >
                              #{order.id.slice(0, 8).toUpperCase()}
                            </Link>
                          </td>
                          <td className="capitalize">{order.status}</td>
                          <td>{order.itemCount}</td>
                          <td>{formatPrice(order.totalAmount)}</td>
                          <td>
                            {new Date(order.createdAt).toLocaleDateString(
                              "pt-BR"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-zinc-500">
                  Este cliente ainda não fez pedidos.
                </p>
              )}
            </AdminPanel>
          </div>
        )}
      </AdminShell>
    </RequireAdmin>
  );
}
