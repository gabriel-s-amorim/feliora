"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell, RequireAdmin } from "@/components/admin/AdminShell";
import { AdminBadge, AdminEmpty, AdminSpinner } from "@/components/admin/ui";
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

  return (
    <RequireAdmin>
      <AdminShell
        title="Pedidos"
        description="Pedidos do site (Mercado Pago)."
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
                <li key={order.id}>
                  <Link
                    href={`/admin/pedidos/${order.id}`}
                    className="flex items-center gap-3 rounded-[1.1rem] border border-zinc-200 bg-white p-3.5 shadow-[var(--admin-shadow)] active:bg-zinc-50"
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
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Pagamento</th>
                    <th>Total</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
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
