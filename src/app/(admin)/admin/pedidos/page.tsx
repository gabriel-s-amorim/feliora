"use client";

import { ChevronRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell, RequireAdmin } from "@/components/admin/AdminShell";
import {
  AdminBadge,
  AdminButton,
  AdminEmpty,
  AdminSpinner,
} from "@/components/admin/ui";
import { formatPrice } from "@/lib/utils";
import type { AdminOrderSummary } from "@/shared/types/order";

function paymentLabel(status: string) {
  const map: Record<string, string> = {
    approved: "Aprovado",
    pending: "Pendente",
    processing: "Processando",
    rejected: "Recusado",
    canceled: "Cancelado",
    expired: "Expirado",
    refunded: "Estornado",
  };
  return map[status] ?? status;
}

function paymentTone(status: string): "success" | "muted" {
  return status === "approved" ? "success" : "muted";
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void fetch("/api/admin/orders")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Erro ao carregar");
        setOrders(data);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Erro ao carregar")
      )
      .finally(() => setLoading(false));
  }, []);

  const deletableIds = orders
    .filter(
      (order) =>
        order.status === "canceled" &&
        (!order.stockDecrementedAt || order.stockRestoredAt)
    )
    .map((order) => order.id);

  function toggleSelected(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function deleteSelected() {
    if (!selected.size) return;
    if (
      !window.confirm(
        `Excluir permanentemente ${selected.size} pedido(s) cancelado(s)?`
      )
    ) {
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: Array.from(selected) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao excluir pedidos");
      setOrders((current) => current.filter((order) => !selected.has(order.id)));
      setSelected(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir pedidos");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <RequireAdmin>
      <AdminShell
        title="Pedidos"
        description="Pedidos do site (Mercado Pago)."
        actions={
          selected.size ? (
            <AdminButton
              variant="danger"
              disabled={deleting}
              onClick={() => void deleteSelected()}
            >
              <Trash2 className="size-4" />
              {deleting ? "Excluindo…" : `Excluir (${selected.size})`}
            </AdminButton>
          ) : undefined
        }
      >
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <AdminSpinner /> Carregando…
          </div>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : orders.length === 0 ? (
          <AdminEmpty
            title="Nenhum pedido ainda"
            description="Quando houver vendas no site, elas aparecem aqui."
          />
        ) : (
          <>
            {/* Mobile cards */}
            <ul className="space-y-2.5 md:hidden">
              {orders.map((order) => (
                <li
                  key={order.id}
                  className="flex items-center gap-2 rounded-[1.1rem] border border-zinc-200 bg-white p-3 shadow-[var(--admin-shadow)]"
                >
                  <input
                    type="checkbox"
                    aria-label={`Selecionar pedido ${order.id}`}
                    checked={selected.has(order.id)}
                    disabled={!deletableIds.includes(order.id)}
                    onChange={() => toggleSelected(order.id)}
                    className="size-4 accent-zinc-950 disabled:opacity-30"
                  />
                  <Link
                    href={`/admin/pedidos/${order.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3 p-0.5 active:bg-zinc-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-zinc-950">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <AdminBadge tone={paymentTone(order.paymentStatus)}>
                          {paymentLabel(order.paymentStatus)}
                        </AdminBadge>
                      </div>
                      <p className="mt-1 truncate text-sm text-zinc-700">
                        {order.customerName || "Cliente"}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-500">
                        <span className="font-medium text-zinc-800">
                          {formatPrice(order.totalAmount)}
                        </span>
                        <span>·</span>
                        <span>
                          {order.itemCount}{" "}
                          {order.itemCount === 1 ? "item" : "itens"}
                        </span>
                        <span>·</span>
                        <span>
                          {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                        <span>·</span>
                        <span>{order.fulfillmentStatus}</span>
                      </div>
                    </div>
                    <ChevronRight className="size-5 shrink-0 text-zinc-300" />
                  </Link>
                </li>
              ))}
            </ul>

            {/* Desktop table */}
            <div className="admin-table-wrap hidden overflow-x-auto md:block">
              <table className="admin-table min-w-full">
                <thead>
                  <tr>
                    <th className="w-10">
                      <input
                        type="checkbox"
                        aria-label="Selecionar todos os pedidos cancelados"
                        checked={
                          deletableIds.length > 0 &&
                          deletableIds.every((id) => selected.has(id))
                        }
                        onChange={() =>
                          setSelected((current) => {
                            const allSelected = deletableIds.every((id) =>
                              current.has(id)
                            );
                            return allSelected
                              ? new Set()
                              : new Set(deletableIds);
                          })
                        }
                        className="size-4 accent-zinc-950"
                      />
                    </th>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Pagamento</th>
                    <th>Envio</th>
                    <th>Total</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Selecionar pedido ${order.id}`}
                          checked={selected.has(order.id)}
                          disabled={!deletableIds.includes(order.id)}
                          onChange={() => toggleSelected(order.id)}
                          className="size-4 accent-zinc-950 disabled:opacity-30"
                        />
                      </td>
                      <td>
                        <Link
                          href={`/admin/pedidos/${order.id}`}
                          className="font-medium text-zinc-900 hover:underline"
                        >
                          #{order.id.slice(0, 8).toUpperCase()}
                        </Link>
                        <p className="text-xs text-zinc-500">
                          {order.itemCount}{" "}
                          {order.itemCount === 1 ? "item" : "itens"}
                        </p>
                      </td>
                      <td>
                        <p className="text-zinc-800">
                          {order.customerName || "—"}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {order.customerEmail || ""}
                        </p>
                      </td>
                      <td>
                        <p>{paymentLabel(order.paymentStatus)}</p>
                        <p className="text-xs capitalize text-zinc-500">
                          {order.paymentMethod?.replace("_", " ")}
                        </p>
                      </td>
                      <td className="text-xs capitalize text-zinc-600">
                        {order.fulfillmentStatus}
                      </td>
                      <td className="font-medium">
                        {formatPrice(order.totalAmount)}
                      </td>
                      <td className="text-zinc-500">
                        {new Date(order.createdAt).toLocaleString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </AdminShell>
    </RequireAdmin>
  );
}
