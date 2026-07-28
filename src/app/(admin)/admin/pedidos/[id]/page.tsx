"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminShell, RequireAdmin } from "@/components/admin/AdminShell";
import { AdminSpinner } from "@/components/admin/ui";
import { formatPrice } from "@/lib/utils";
import type { AdminOrderDetail } from "@/shared/types/order";

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;
    void fetch(`/api/admin/orders/${params.id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Erro ao carregar");
        setOrder(data);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Erro ao carregar")
      )
      .finally(() => setLoading(false));
  }, [params.id]);

  return (
    <RequireAdmin>
      <AdminShell
        title={
          order
            ? `Pedido #${order.id.slice(0, 8).toUpperCase()}`
            : "Pedido"
        }
        description="Detalhes do pedido do site"
        actions={
          <Link
            href="/admin/pedidos"
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
        ) : error || !order ? (
          <p className="text-sm text-red-600">{error ?? "Não encontrado"}</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-zinc-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-zinc-900">Cliente</h2>
              <dl className="mt-3 space-y-1 text-sm text-zinc-600">
                <div>{order.customerName || "—"}</div>
                <div>{order.customerEmail || "—"}</div>
                <div>{order.customerPhone || "—"}</div>
              </dl>
              <h2 className="mt-6 text-sm font-semibold text-zinc-900">
                Entrega
              </h2>
              <p className="mt-2 text-sm text-zinc-600">
                {order.shippingAddress.rua}, {order.shippingAddress.numero}
                {order.shippingAddress.complemento
                  ? ` — ${order.shippingAddress.complemento}`
                  : ""}
                <br />
                {order.shippingAddress.bairro} · {order.shippingAddress.cidade}/
                {order.shippingAddress.estado}
                <br />
                CEP {order.shippingAddress.cep}
              </p>
              {order.shippingServiceName ? (
                <p className="mt-2 text-sm text-zinc-500">
                  {order.shippingCompany} — {order.shippingServiceName} (
                  {formatPrice(order.shippingAmount)})
                </p>
              ) : null}
            </section>

            <section className="rounded-xl border border-zinc-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-zinc-900">Pagamento</h2>
              <dl className="mt-3 space-y-1 text-sm text-zinc-600">
                <div>Status: {order.paymentStatus}</div>
                <div>Método: {order.paymentMethod}</div>
                <div>Total: {formatPrice(order.totalAmount)}</div>
                {order.paidAt ? (
                  <div>
                    Pago em:{" "}
                    {new Date(order.paidAt).toLocaleString("pt-BR")}
                  </div>
                ) : null}
              </dl>
              <h2 className="mt-6 text-sm font-semibold text-zinc-900">
                Itens
              </h2>
              <ul className="mt-3 divide-y divide-zinc-100 text-sm">
                {order.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex justify-between gap-3 py-2"
                  >
                    <span>
                      {item.productName} · {item.sizeLabel}
                      {item.colorName ? ` / ${item.colorName}` : ""} ×
                      {item.quantity}
                    </span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </AdminShell>
    </RequireAdmin>
  );
}
