"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { EmptyState } from "@/components/store/EmptyState";
import { formatPrice } from "@/lib/utils";

export function CartPageClient() {
  const { cart, loading, updateQuantity, removeItem, error } = useCart();

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl animate-pulse px-4 py-14 sm:px-6 lg:px-8">
        <div className="h-8 w-40 bg-ivory" />
        <div className="mt-8 space-y-4">
          <div className="h-28 bg-ivory" />
          <div className="h-28 bg-ivory" />
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <EmptyState
        title="Seu carrinho está vazio"
        description="Explore a coleção e adicione as peças que combinam com você."
        actionHref="/catalogo"
        actionLabel="Ir ao catálogo"
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 pb-28 sm:px-6 lg:px-8 lg:py-14 lg:pb-14">
      <header className="mb-8">
        <p className="font-display text-xs uppercase tracking-[0.35em] text-rose-gold">
          Sacola
        </p>
        <h1 className="mt-3 font-display text-3xl font-light tracking-[0.06em] text-ink">
          Carrinho
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          {cart.itemCount} {cart.itemCount === 1 ? "item" : "itens"}
        </p>
      </header>

      {error ? (
        <p className="mb-4 text-sm text-rose-gold">{error}</p>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <ul className="divide-y divide-line border-y border-line">
          {cart.items.map((item) => (
            <li key={item.id} className="flex gap-4 py-5">
              <Link
                href={`/produto/${item.productSlug}`}
                className="relative h-28 w-20 shrink-0 overflow-hidden bg-ivory"
              >
                {item.productImage ? (
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : null}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <Link
                  href={`/produto/${item.productSlug}`}
                  className="font-display text-lg tracking-[0.04em] text-ink hover:text-rose-gold"
                >
                  {item.productName}
                </Link>
                <p className="mt-1 text-xs text-ink-muted">
                  {item.sizeLabel}
                  {item.colorName ? ` · ${item.colorName}` : ""}
                </p>
                <p className="mt-2 text-sm text-ink">
                  {formatPrice(item.unitPrice)}
                </p>

                <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                  <div className="flex items-center border border-line">
                    <button
                      type="button"
                      className="flex size-10 items-center justify-center text-ink"
                      aria-label="Diminuir"
                      onClick={() =>
                        void updateQuantity(item.id, item.quantity - 1)
                      }
                    >
                      −
                    </button>
                    <span className="min-w-8 text-center text-sm">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="flex size-10 items-center justify-center text-ink"
                      aria-label="Aumentar"
                      onClick={() =>
                        void updateQuantity(item.id, item.quantity + 1)
                      }
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className="text-xs tracking-wide text-ink-muted hover:text-rose-gold"
                    onClick={() => void removeItem(item.id)}
                  >
                    Remover
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="hidden h-fit border border-line bg-ivory/40 p-5 lg:sticky lg:top-24 lg:block">
          <h2 className="font-display text-lg tracking-[0.06em] text-ink">
            Resumo
          </h2>
          <div className="mt-4 flex justify-between text-sm">
            <span className="text-ink-muted">Subtotal</span>
            <span className="text-ink">{formatPrice(cart.subtotal)}</span>
          </div>
          <p className="mt-2 text-[11px] text-ink-muted">
            Frete e cupom são calculados no checkout.
          </p>
          <Link
            href="/checkout"
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center border border-rose-gold bg-rose-gold text-sm tracking-[0.14em] text-cream transition-colors hover:bg-rose-gold-light"
          >
            Finalizar compra
          </Link>
          <Link
            href="/catalogo"
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center text-xs tracking-[0.14em] text-ink-muted hover:text-rose-gold"
          >
            Continuar comprando
          </Link>
        </aside>
      </div>

      {/* Mobile sticky checkout */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-cream/95 px-4 pt-3 backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-ink-muted">Subtotal</span>
          <span className="font-medium text-ink">
            {formatPrice(cart.subtotal)}
          </span>
        </div>
        <Link
          href="/checkout"
          className="inline-flex min-h-12 w-full items-center justify-center border border-rose-gold bg-rose-gold text-sm tracking-[0.14em] text-cream"
        >
          Finalizar compra
        </Link>
      </div>
    </div>
  );
}
