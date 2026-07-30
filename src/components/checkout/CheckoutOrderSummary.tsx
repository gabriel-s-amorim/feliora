"use client";

import Image from "next/image";
import { ChevronDown, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { cn, formatPrice } from "@/lib/utils";
import type { Cart } from "@/shared/types/cart";

export function CheckoutOrderSummary({
  cart,
  shippingAmount,
  discountAmount = 0,
  couponCode = null,
  onRemoveCoupon,
  shippingPending = false,
  className,
}: {
  cart: Cart;
  shippingAmount: number | null;
  discountAmount?: number;
  couponCode?: string | null;
  onRemoveCoupon?: () => void;
  shippingPending?: boolean;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const shipping = shippingAmount ?? 0;
  const total = Math.max(0, cart.subtotal - discountAmount + shipping);

  return (
    <aside
      className={cn(
        "h-fit min-w-0 overflow-hidden rounded-2xl border border-line bg-cream/95 shadow-[0_18px_50px_rgba(44,36,27,0.06)] lg:sticky lg:top-24",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex min-h-20 w-full items-center gap-3 px-4 text-left lg:hidden"
        aria-expanded={expanded}
        aria-controls="checkout-order-summary"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ivory text-rose-gold">
          <ShoppingBag className="size-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-ink">
            Resumo do pedido
          </span>
          <span className="block text-xs text-ink-muted">
            {cart.itemCount} {cart.itemCount === 1 ? "item" : "itens"}
            {shippingPending ? " · frete a calcular" : ""}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block font-display text-lg text-ink">
            {formatPrice(total)}
          </span>
          <ChevronDown
            className={cn(
              "ml-auto size-4 text-ink-muted transition-transform duration-300",
              expanded && "rotate-180"
            )}
            aria-hidden
          />
        </span>
      </button>

      <div
        id="checkout-order-summary"
        className={cn(
          "border-t border-line px-4 pb-5 pt-4 lg:block lg:border-t-0 lg:p-6",
          expanded ? "block animate-fade-in" : "hidden"
        )}
      >
        <h2 className="hidden font-display text-xl font-light tracking-[0.06em] text-ink lg:block">
          Resumo do pedido
        </h2>
        <ul className="max-h-52 space-y-3 overflow-y-auto pr-1 lg:mt-5 lg:max-h-64">
          {cart.items.map((item) => (
            <li key={item.id} className="flex gap-3">
              <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-ivory">
                {item.productImage ? (
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">{item.productName}</p>
                <p className="text-xs text-ink-muted">
                  {item.sizeLabel}
                  {item.colorName ? ` · ${item.colorName}` : ""} · ×
                  {item.quantity}
                </p>
                <p className="mt-0.5 text-sm text-ink">
                  {formatPrice(item.unitPrice * item.quantity)}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between text-ink-muted">
            <dt>Subtotal</dt>
            <dd>{formatPrice(cart.subtotal)}</dd>
          </div>
          {discountAmount > 0 ? (
            <div className="flex items-center justify-between gap-2 text-ink-muted">
              <dt className="min-w-0">
                Desconto
                {couponCode ? (
                  <span className="ml-1 text-xs">({couponCode})</span>
                ) : null}
              </dt>
              <dd className="flex items-center gap-1.5">
                <span>-{formatPrice(discountAmount)}</span>
                {onRemoveCoupon ? (
                  <button
                    type="button"
                    onClick={onRemoveCoupon}
                    className="inline-flex size-6 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-ivory hover:text-ink"
                    aria-label="Remover cupom"
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                ) : null}
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between text-ink-muted">
            <dt>Frete</dt>
            <dd>
              {shippingAmount == null
                ? "Calcule o frete"
                : shippingAmount === 0
                  ? "Grátis"
                  : formatPrice(shippingAmount)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 font-medium text-ink">
            <dt>Total</dt>
            <dd className="font-display text-lg tracking-[0.04em]">
              {shippingAmount == null
                ? formatPrice(Math.max(0, cart.subtotal - discountAmount))
                : formatPrice(total)}
            </dd>
          </div>
        </dl>
        {shippingPending ? (
          <p className="mt-4 rounded-xl border border-rose-gold/25 bg-rose-gold/5 px-3 py-2 text-xs leading-relaxed text-rose-gold">
            Informe o CEP na etapa de entrega para calcular o frete e liberar o
            pagamento.
          </p>
        ) : null}
      </div>
    </aside>
  );
}
