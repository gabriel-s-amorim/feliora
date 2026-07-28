"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell, RequireAdmin } from "@/components/admin/AdminShell";
import { AdminSpinner } from "@/components/admin/ui";
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
          <p className="text-sm text-zinc-500">Nenhum pedido ainda.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Pedido</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Pagamento</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-50/80">
                    <td className="px-4 py-3">
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
                    <td className="px-4 py-3">
                      <p className="text-zinc-800">
                        {order.customerName || "—"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {order.customerEmail || ""}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{paymentLabel(order.paymentStatus)}</p>
                      <p className="text-xs capitalize text-zinc-500">
                        {order.paymentMethod?.replace("_", " ")}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {formatPrice(order.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {new Date(order.createdAt).toLocaleString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminShell>
    </RequireAdmin>
  );
}
