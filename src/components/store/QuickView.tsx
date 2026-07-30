"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import type { Product, ProductVariant } from "@/shared/types/product";
import { cn, formatPrice } from "@/lib/utils";
import { VariantSelector } from "@/components/store/VariantSelector";
import { useCart } from "@/contexts/CartContext";

type QuickViewProps = {
  product: Product | null;
  open: boolean;
  onClose: () => void;
};

export function QuickView({ product, open, onClose }: QuickViewProps) {
  const activeVariants = useMemo(
    () => (product?.variants ?? []).filter((v) => v.isActive),
    [product]
  );

  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { addItem, error } = useCart();

  useEffect(() => {
    if (!product) return;
    const first =
      activeVariants.find((v) => v.stockCount > 0) ?? activeVariants[0];
    setSize(first?.sizeLabel ?? "");
    setColor(first?.colorName ?? "");
    setMessage(null);
  }, [product, activeVariants]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !product) return null;

  const selected: ProductVariant | undefined = activeVariants.find(
    (v) =>
      v.sizeLabel === size && (v.colorName || "") === (color || "")
  );

  const available = Boolean(selected && selected.stockCount > 0);

  async function handleAdd() {
    if (!selected || !available) return;
    setPending(true);
    setMessage(null);
    const ok = await addItem(selected.id, 1);
    setPending(false);
    if (ok) setMessage("Adicionado ao carrinho");
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/45 backdrop-blur-[1px]"
        aria-label="Fechar"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal
        aria-label={product.name}
        className="relative z-10 flex max-h-[88dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-line bg-cream shadow-2xl sm:max-h-[min(85vh,640px)] sm:flex-row sm:rounded-xl"
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-2.5 sm:hidden" aria-hidden>
          <span className="h-1 w-10 rounded-full bg-line" />
        </div>

        {/* Image — capped height on mobile so content stays visible */}
        <div className="relative mx-4 mt-2 h-[min(34dvh,240px)] shrink-0 overflow-hidden rounded-xl bg-ivory sm:mx-0 sm:mt-0 sm:h-auto sm:w-[42%] sm:rounded-none">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover object-top"
              sizes="(max-width: 640px) 100vw, 42vw"
              priority
            />
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-2 top-2 flex size-9 items-center justify-center rounded-full bg-cream/90 text-ink shadow-sm backdrop-blur-sm sm:right-3 sm:top-3"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Details + sticky CTA */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-4 pb-3 pt-4 sm:px-7 sm:pb-4 sm:pt-7">
            <p className="text-[10px] uppercase tracking-[0.18em] text-earth">
              {product.category?.name}
            </p>
            <h2 className="mt-1.5 font-display text-[1.65rem] font-light leading-tight tracking-[0.04em] text-ink sm:text-2xl">
              {product.name}
            </h2>

            <div className="mt-2 flex items-baseline gap-2.5">
              <p className="text-base font-medium text-ink">
                {formatPrice(product.price)}
              </p>
              {product.originalPrice != null &&
              product.originalPrice > product.price ? (
                <p className="text-sm text-ink-muted line-through">
                  {formatPrice(product.originalPrice)}
                </p>
              ) : null}
            </div>

            {product.shortDescription ? (
              <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-muted">
                {product.shortDescription}
              </p>
            ) : null}

            <div className="mt-5">
              <VariantSelector
                product={product}
                size={size}
                color={color}
                onSizeChange={setSize}
                onColorChange={setColor}
              />
            </div>

            <p
              className={cn(
                "mt-3 text-xs tracking-wide",
                available ? "text-earth" : "text-rose-gold"
              )}
            >
              {available ? "Em estoque" : "Combinação indisponível"}
            </p>

            {(message || error) && (
              <p
                className={cn(
                  "mt-2 text-xs",
                  message ? "text-earth" : "text-rose-gold"
                )}
              >
                {message ?? error}
              </p>
            )}
          </div>

          <div
            className="shrink-0 border-t border-line bg-cream px-4 pt-3 sm:px-7"
            style={{
              paddingBottom: "max(0.85rem, env(safe-area-inset-bottom))",
            }}
          >
            <button
              type="button"
              disabled={!available || pending}
              onClick={() => void handleAdd()}
              className="inline-flex min-h-12 w-full items-center justify-center border border-rose-gold bg-rose-gold text-sm tracking-[0.14em] text-cream transition-colors hover:bg-rose-gold-light disabled:opacity-40"
            >
              {pending ? "Adicionando…" : "Adicionar ao carrinho"}
            </button>
            <Link
              href={`/produto/${product.slug}`}
              className="mt-2 inline-flex min-h-10 w-full items-center justify-center text-sm tracking-[0.12em] text-ink-muted hover:text-rose-gold"
              onClick={onClose}
            >
              Ver produto completo
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
