"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";

export function CartDrawer() {
  const {
    cart,
    loading,
    error,
    drawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
  } = useCart();

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen, closeDrawer]);

  return (
    <div
      className={`fixed inset-0 z-[60] ${drawerOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!drawerOpen}
    >
      <button
        type="button"
        aria-label="Fechar carrinho"
        onClick={closeDrawer}
        className={`absolute inset-0 bg-ink/35 transition-opacity duration-300 ${
          drawerOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Carrinho"
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-line bg-cream shadow-[-12px_0_40px_rgba(44,36,27,0.08)] transition-transform duration-300 ease-out ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <p className="font-display text-[10px] uppercase tracking-[0.28em] text-rose-gold">
              Sacola
            </p>
            <h2 className="mt-1 font-display text-xl font-light tracking-[0.06em] text-ink">
              Carrinho
              {cart.itemCount > 0 ? (
                <span className="ml-2 text-sm text-ink-muted">
                  ({cart.itemCount})
                </span>
              ) : null}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="flex size-11 items-center justify-center text-ink-muted transition-colors hover:text-ink"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-24 bg-ivory" />
              <div className="h-24 bg-ivory" />
            </div>
          ) : cart.items.length === 0 ? (
            <div className="flex h-full min-h-[40vh] flex-col items-center justify-center text-center">
              <div
                className="mb-5 size-14 rounded-full border border-line"
                aria-hidden
              />
              <p className="font-display text-lg tracking-[0.06em] text-ink">
                Sacola vazia
              </p>
              <p className="mt-2 max-w-[220px] text-sm text-ink-muted">
                Explore a coleção e adicione as peças que combinam com você.
              </p>
              <button
                type="button"
                onClick={closeDrawer}
                className="mt-8 inline-flex min-h-11 items-center border border-rose-gold px-6 text-xs tracking-[0.14em] text-rose-gold transition-colors hover:bg-rose-gold hover:text-cream"
              >
                Continuar comprando
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {cart.items.map((item) => (
                <li key={item.id} className="flex gap-3 py-4">
                  <Link
                    href={`/produto/${item.productSlug}`}
                    onClick={closeDrawer}
                    className="relative h-24 w-[4.5rem] shrink-0 overflow-hidden bg-ivory"
                  >
                    {item.productImage ? (
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        className="object-cover"
                        sizes="72px"
                      />
                    ) : null}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/produto/${item.productSlug}`}
                      onClick={closeDrawer}
                      className="font-display text-base leading-snug tracking-[0.03em] text-ink hover:text-rose-gold"
                    >
                      {item.productName}
                    </Link>
                    <p className="mt-1 text-[11px] text-ink-muted">
                      {item.sizeLabel}
                      {item.colorName ? ` · ${item.colorName}` : ""}
                    </p>
                    <p className="mt-1.5 text-sm text-ink">
                      {formatPrice(item.unitPrice)}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center border border-line">
                        <button
                          type="button"
                          className="flex size-9 items-center justify-center text-ink"
                          aria-label="Diminuir"
                          onClick={() =>
                            void updateQuantity(item.id, item.quantity - 1)
                          }
                        >
                          −
                        </button>
                        <span className="min-w-7 text-center text-xs">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="flex size-9 items-center justify-center text-ink"
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
                        className="text-[11px] tracking-wide text-ink-muted hover:text-rose-gold"
                        onClick={() => void removeItem(item.id)}
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {error ? (
            <p className="mt-3 text-xs text-rose-gold">{error}</p>
          ) : null}
        </div>

        {cart.items.length > 0 ? (
          <div className="border-t border-line bg-ivory/50 px-5 py-5">
            <div className="flex items-baseline justify-between">
              <span className="text-xs uppercase tracking-[0.14em] text-earth">
                Subtotal
              </span>
              <span className="font-display text-xl tracking-[0.04em] text-ink">
                {formatPrice(cart.subtotal)}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-ink-muted">
              Frete calculado no checkout.
            </p>
            <Link
              href="/checkout"
              onClick={closeDrawer}
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center border border-rose-gold bg-rose-gold text-sm tracking-[0.16em] text-cream transition-colors hover:bg-rose-gold-light"
            >
              Finalizar compra
            </Link>
            <Link
              href="/carrinho"
              onClick={closeDrawer}
              className="mt-2 inline-flex min-h-10 w-full items-center justify-center text-xs tracking-[0.12em] text-ink-muted hover:text-rose-gold"
            >
              Ver sacola completa
            </Link>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
