"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminShell, RequireAdmin } from "@/components/admin/AdminShell";
import { AdminButton, AdminSpinner } from "@/components/admin/ui";
import { formatPrice } from "@/lib/utils";
import type {
  AdminOrderDetail,
  FulfillmentStatus,
} from "@/shared/types/order";

const FULFILLMENT_OPTIONS: { value: FulfillmentStatus; label: string }[] = [
  { value: "unfulfilled", label: "Não iniciado" },
  { value: "processing", label: "Em preparação" },
  { value: "shipped", label: "Enviado" },
  { value: "delivered", label: "Entregue" },
];

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fulfillmentStatus, setFulfillmentStatus] =
    useState<FulfillmentStatus>("unfulfilled");
  const [trackingCode, setTrackingCode] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [savingFulfillment, setSavingFulfillment] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [fulfillmentMessage, setFulfillmentMessage] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!params.id) return;
    void fetch(`/api/admin/orders/${params.id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Erro ao carregar");
        setOrder(data);
        setFulfillmentStatus(data.fulfillmentStatus);
        setTrackingCode(data.trackingCode ?? "");
        setTrackingUrl(data.trackingUrl ?? "");
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Erro ao carregar")
      )
      .finally(() => setLoading(false));
  }, [params.id]);

  async function saveFulfillment() {
    if (!params.id) return;
    setSavingFulfillment(true);
    setFulfillmentMessage(null);
    try {
      const res = await fetch(`/api/admin/orders/${params.id}/fulfillment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: fulfillmentStatus,
          trackingCode: trackingCode.trim() || null,
          trackingUrl: trackingUrl.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const issue = data.issues?.[0]?.message;
        throw new Error(issue ?? data.error ?? "Erro ao salvar");
      }
      setOrder(data);
      setFulfillmentStatus(data.fulfillmentStatus);
      setTrackingCode(data.trackingCode ?? "");
      setTrackingUrl(data.trackingUrl ?? "");
      setFulfillmentMessage("Fulfillment atualizado. E-mail disparado se aplicável.");
    } catch (err) {
      setFulfillmentMessage(
        err instanceof Error ? err.message : "Erro ao salvar"
      );
    } finally {
      setSavingFulfillment(false);
    }
  }

  async function cancelOrder() {
    if (!params.id || !order) return;
    if (
      !window.confirm(
        order.status === "canceled"
          ? "Devolver ao estoque os itens deste pedido cancelado?"
          : "Cancelar este pedido? O estoque baixado será devolvido. O pagamento não será estornado automaticamente."
      )
    ) {
      return;
    }

    setCanceling(true);
    setFulfillmentMessage(null);
    try {
      const res = await fetch(`/api/admin/orders/${params.id}/cancel`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao cancelar pedido");
      setOrder(data);
      setFulfillmentStatus(data.fulfillmentStatus);
      setFulfillmentMessage(
        data.stockRestoredAt
          ? "Pedido cancelado e estoque devolvido."
          : "Pedido cancelado. Não havia baixa de estoque para devolver."
      );
    } catch (err) {
      setFulfillmentMessage(
        err instanceof Error ? err.message : "Erro ao cancelar pedido"
      );
    } finally {
      setCanceling(false);
    }
  }

  return (
    <RequireAdmin>
      <AdminShell
        title={
          order
            ? `Pedido #${order.id.slice(0, 8).toUpperCase()}`
            : "Pedido"
        }
        description="Detalhes, fulfillment e rastreio do pedido do site"
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
                {order.shippingRecipient?.document ? (
                  <div>CPF: {order.shippingRecipient.document}</div>
                ) : null}
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

            <section className="rounded-xl border border-zinc-200 bg-white p-5 lg:col-span-2">
              <h2 className="text-sm font-semibold text-zinc-900">
                Fulfillment e rastreio
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Ao marcar como enviado/entregue, o cliente recebe e-mail via
                Brevo (se a integração estiver ativa).
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <label className="text-sm">
                  Status
                  <select
                    value={fulfillmentStatus}
                    onChange={(e) =>
                      setFulfillmentStatus(e.target.value as FulfillmentStatus)
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
                  >
                    {fulfillmentStatus === "canceled" ? (
                      <option value="canceled">Cancelado</option>
                    ) : null}
                    {FULFILLMENT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  Código de rastreio
                  <input
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
                    placeholder="obrigatório se enviado"
                  />
                </label>
                <label className="text-sm">
                  URL de rastreio
                  <input
                    value={trackingUrl}
                    onChange={(e) => setTrackingUrl(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
                    placeholder="https://…"
                  />
                </label>
              </div>
              {(order.processingAt || order.shippedAt || order.deliveredAt) && (
                <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                  {order.processingAt ? (
                    <div>
                      Preparação:{" "}
                      {new Date(order.processingAt).toLocaleString("pt-BR")}
                    </div>
                  ) : null}
                  {order.shippedAt ? (
                    <div>
                      Enviado:{" "}
                      {new Date(order.shippedAt).toLocaleString("pt-BR")}
                    </div>
                  ) : null}
                  {order.deliveredAt ? (
                    <div>
                      Entregue:{" "}
                      {new Date(order.deliveredAt).toLocaleString("pt-BR")}
                    </div>
                  ) : null}
                </dl>
              )}
              {fulfillmentMessage ? (
                <p className="mt-3 text-sm text-zinc-600">{fulfillmentMessage}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <AdminButton
                  disabled={
                    savingFulfillment || order.status === "canceled"
                  }
                  onClick={() => void saveFulfillment()}
                >
                  {savingFulfillment ? "Salvando…" : "Atualizar fulfillment"}
                </AdminButton>
                {order.status !== "canceled" ||
                (order.stockDecrementedAt && !order.stockRestoredAt) ? (
                  <AdminButton
                    variant="danger"
                    disabled={canceling || order.fulfillmentStatus === "delivered"}
                    onClick={() => void cancelOrder()}
                  >
                    {canceling
                      ? "Processando…"
                      : order.status === "canceled"
                        ? "Devolver estoque"
                        : "Cancelar pedido"}
                  </AdminButton>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                O cancelamento devolve o estoque, mas não estorna o pagamento no
                Mercado Pago.
              </p>
            </section>
          </div>
        )}
      </AdminShell>
    </RequireAdmin>
  );
}
