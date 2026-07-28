"use client";

import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import type { Cart } from "@/shared/types/cart";

export function CheckoutOrderSummary({
  cart,
  shippingAmount,
  discountAmount = 0,
}: {
  cart: Cart;
  shippingAmount: number | null;
  discountAmount?: number;
}) {
  const shipping = shippingAmount ?? 0;
  const total = Math.max(0, cart.subtotal - discountAmount + shipping);

  return (
    <aside className="border border-line bg-ivory/40 p-5 sm:p-6">
      <h2 className="font-display text-xl font-light tracking-[0.06em] text-ink">
        Resumo
      </h2>
      <ul className="mt-5 max-h-64 space-y-3 overflow-y-auto">
        {cart.items.map((item) => (
          <li key={item.id} className="flex gap-3">
            <div className="relative h-16 w-12 shrink-0 overflow-hidden bg-ivory">
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
                {item.colorName ? ` · ${item.colorName}` : ""} · ×{item.quantity}
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
          <div className="flex justify-between text-ink-muted">
            <dt>Desconto</dt>
            <dd>-{formatPrice(discountAmount)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between text-ink-muted">
          <dt>Frete</dt>
          <dd>
            {shippingAmount == null
              ? "—"
              : shippingAmount === 0
                ? "Grátis"
                : formatPrice(shippingAmount)}
          </dd>
        </div>
        <div className="flex justify-between border-t border-line pt-3 font-medium text-ink">
          <dt>Total</dt>
          <dd className="font-display text-lg tracking-[0.04em]">
            {formatPrice(total)}
          </dd>
        </div>
      </dl>
    </aside>
  );
}
