"use client";

import { ArrowLeft, ExternalLink, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { OrderChatPanel } from "@/components/store/orders/OrderChatPanel";
import { OrderTimeline } from "@/components/store/orders/OrderTimeline";
import { formatPrice } from "@/lib/utils";
import {
  customerOrderStatusLabel,
  paymentMethodLabel,
  paymentStatusLabel,
} from "@/shared/lib/orderLabels";
import type { Order } from "@/shared/types/order";

function isRemoteImage(src: string) {
  return /^https?:\/\//i.test(src);
}

export function OrderDetailClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useCustomerAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(
        `/conta/entrar?next=${encodeURIComponent(`/conta/pedidos/${params.id}`)}`
      );
      return;
    }
    if (!params.id) return;

    let cancelled = false;

    void fetch(`/api/orders/${params.id}`)
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error ?? "Pedido não encontrado");
        setOrder(data as Order);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Erro ao carregar");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, params.id, router]);

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-2xl animate-pulse px-4 py-10">
        <div className="h-6 w-32 bg-ivory" />
        <div className="mt-6 h-40 bg-ivory" />
        <div className="mt-4 h-56 bg-ivory" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Link
          href="/conta"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-rose-gold"
        >
          <ArrowLeft className="size-4" strokeWidth={1.5} />
          Voltar
        </Link>
        <p className="mt-6 border border-rose-gold/30 bg-rose-gold/5 px-4 py-4 text-sm text-rose-gold">
          {error ?? "Pedido não encontrado"}
        </p>
      </div>
    );
  }

  const itemsSubtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const statusLabel = customerOrderStatusLabel(order);
  const canReview = order.fulfillmentStatus === "delivered";

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => router.push("/conta")}
            className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-rose-gold"
          >
            <ArrowLeft className="size-4" strokeWidth={1.5} />
            Voltar
          </button>
          <h1 className="mt-3 font-display text-2xl font-light tracking-[0.06em] text-ink sm:text-3xl">
            Pedido #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {new Date(order.createdAt).toLocaleString("pt-BR")} · {statusLabel}
          </p>
        </div>
        <p className="font-display text-lg text-ink">
          {formatPrice(order.totalAmount)}
        </p>
      </div>

      <section className="border border-line bg-cream/40 p-5">
        <h2 className="font-display text-lg font-light tracking-[0.04em] text-ink">
          Acompanhamento
        </h2>
        <div className="mt-4">
          <OrderTimeline order={order} />
        </div>
      </section>

      <section className="border border-line bg-cream/40 p-5">
        <h2 className="font-display text-lg font-light tracking-[0.04em] text-ink">
          Envio
        </h2>
        <dl className="mt-3 space-y-2 text-sm text-ink-muted">
          {order.shippingCompany || order.shippingServiceName ? (
            <div>
              <dt className="text-[10px] uppercase tracking-[0.14em] text-earth">
                Transportadora
              </dt>
              <dd className="mt-0.5 text-ink">
                {[order.shippingCompany, order.shippingServiceName]
                  .filter(Boolean)
                  .join(" · ")}
              </dd>
            </div>
          ) : null}
          {order.trackingCode ? (
            <div>
              <dt className="text-[10px] uppercase tracking-[0.14em] text-earth">
                Código de rastreio
              </dt>
              <dd className="mt-0.5">
                {order.trackingUrl ? (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-rose-gold underline-offset-2 hover:underline"
                  >
                    {order.trackingCode}
                    <ExternalLink className="size-3.5" strokeWidth={1.5} />
                  </a>
                ) : (
                  <span className="text-ink">{order.trackingCode}</span>
                )}
              </dd>
            </div>
          ) : (
            <p>Rastreio ainda não disponível.</p>
          )}
          <div>
            <dt className="text-[10px] uppercase tracking-[0.14em] text-earth">
              Endereço
            </dt>
            <dd className="mt-0.5 text-ink">
              {order.shippingAddress.rua}, {order.shippingAddress.numero}
              {order.shippingAddress.complemento
                ? ` — ${order.shippingAddress.complemento}`
                : ""}
              <br />
              {order.shippingAddress.bairro} · {order.shippingAddress.cidade}/
              {order.shippingAddress.estado}
              <br />
              CEP {order.shippingAddress.cep}
            </dd>
          </div>
        </dl>
      </section>

      <section className="border border-line bg-cream/40 p-5">
        <h2 className="font-display text-lg font-light tracking-[0.04em] text-ink">
          Itens
        </h2>
        <ul className="mt-4 divide-y divide-line">
          {order.items.map((item) => (
            <li key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <div className="relative size-16 shrink-0 overflow-hidden bg-ivory">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.productName}
                    fill
                    sizes="64px"
                    className="object-cover"
                    unoptimized={!isRemoteImage(item.image)}
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-ink-muted">
                    <Package className="size-5" strokeWidth={1.25} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/produto/${item.productSlug}`}
                  className="text-sm text-ink hover:text-rose-gold"
                >
                  {item.productName}
                </Link>
                <p className="mt-0.5 text-xs text-ink-muted">
                  {item.sizeLabel}
                  {item.colorName ? ` · ${item.colorName}` : ""} · ×
                  {item.quantity}
                </p>
                {canReview ? (
                  <Link
                    href={`/produto/${item.productSlug}#avaliacoes`}
                    className="mt-1 inline-block text-[11px] tracking-[0.08em] text-rose-gold underline-offset-2 hover:underline"
                  >
                    Avaliar produto
                  </Link>
                ) : null}
              </div>
              <p className="shrink-0 text-sm text-ink">
                {formatPrice(item.price * item.quantity)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="border border-line bg-cream/40 p-5">
        <h2 className="font-display text-lg font-light tracking-[0.04em] text-ink">
          Resumo
        </h2>
        <dl className="mt-3 space-y-1.5 text-sm">
          <div className="flex justify-between gap-3 text-ink-muted">
            <dt>Subtotal</dt>
            <dd>{formatPrice(itemsSubtotal)}</dd>
          </div>
          {order.discountAmount > 0 ? (
            <div className="flex justify-between gap-3 text-ink-muted">
              <dt>
                Desconto
                {order.couponCode ? ` (${order.couponCode})` : ""}
              </dt>
              <dd>−{formatPrice(order.discountAmount)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-3 text-ink-muted">
            <dt>Frete</dt>
            <dd>{formatPrice(order.shippingAmount)}</dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-line pt-2 text-ink">
            <dt>Total</dt>
            <dd className="font-medium">{formatPrice(order.totalAmount)}</dd>
          </div>
          <div className="pt-2 text-xs text-ink-muted">
            {paymentMethodLabel(order.paymentMethod)} ·{" "}
            {paymentStatusLabel(order.paymentStatus)}
          </div>
        </dl>
      </section>

      <section className="border border-line bg-cream/40 p-5">
        <h2 className="font-display text-lg font-light tracking-[0.04em] text-ink">
          Mensagens
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Fale com a Feliora sobre este pedido.
        </p>
        <div className="mt-4">
          <OrderChatPanel
            apiPath={`/api/orders/${order.id}/messages`}
            viewerRole="customer"
            pollMs={20000}
          />
        </div>
      </section>
    </div>
  );
}
