"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/shared/types/product";
import { ProductGallery } from "@/components/store/ProductGallery";
import { VariantSelector } from "@/components/store/VariantSelector";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { cn, formatPrice } from "@/lib/utils";

type ProductDetailProps = {
  product: Product;
};

export function ProductDetail({ product }: ProductDetailProps) {
  const variants = useMemo(
    () => (product.variants ?? []).filter((v) => v.isActive),
    [product.variants]
  );
  const first = variants.find((v) => v.stockCount > 0) ?? variants[0];
  const [size, setSize] = useState(first?.sizeLabel ?? "");
  const [color, setColor] = useState(first?.colorName ?? "");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { addItem, error: cartError } = useCart();
  const { has, toggle } = useWishlist();
  const wished = has(product.id);

  const selected = variants.find(
    (v) => v.sizeLabel === size && (v.colorName || "") === (color || "")
  );
  const available = Boolean(selected && selected.stockCount > 0);

  const gallery = [
    product.image,
    ...product.images.filter((img) => img && img !== product.image),
  ].filter(Boolean);

  async function handleAdd() {
    if (!selected || !available) return;
    setPending(true);
    setMessage(null);
    const ok = await addItem(selected.id, 1);
    setPending(false);
    setMessage(ok ? "Adicionado ao carrinho" : null);
  }

  const ctaLabel = pending
    ? "Adicionando…"
    : available
      ? "Adicionar ao carrinho"
      : "Esgotado";

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 pb-28 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:py-14 lg:pb-14">
      <ProductGallery name={product.name} images={gallery} />

      <div>
        {product.category ? (
          <p className="text-[11px] uppercase tracking-[0.18em] text-earth">
            {product.category.name}
          </p>
        ) : null}
        <h1 className="mt-2 font-display text-3xl font-light tracking-[0.04em] text-ink sm:text-4xl">
          {product.name}
        </h1>

        <div className="mt-4 flex items-baseline gap-3">
          <p className="text-lg text-ink">{formatPrice(product.price)}</p>
          {product.originalPrice != null &&
          product.originalPrice > product.price ? (
            <p className="text-sm text-ink-muted line-through">
              {formatPrice(product.originalPrice)}
            </p>
          ) : null}
        </div>

        {product.shortDescription ? (
          <p className="mt-4 text-sm leading-relaxed text-ink-muted">
            {product.shortDescription}
          </p>
        ) : null}

        <div className="mt-8">
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
            "mt-4 text-xs tracking-wide",
            available ? "text-earth" : "text-rose-gold"
          )}
        >
          {available
            ? selected && selected.stockCount <= 3
              ? `Restam apenas ${selected.stockCount}`
              : "Em estoque"
            : "Essa combinação está esgotada"}
        </p>

        {selected?.sku ? (
          <p className="mt-1 text-[11px] text-ink-muted">SKU {selected.sku}</p>
        ) : null}

        {/* Desktop CTAs */}
        <div className="mt-8 hidden flex-col gap-2 sm:flex sm:flex-row">
          <button
            type="button"
            disabled={!available || pending}
            onClick={() => void handleAdd()}
            className="inline-flex min-h-12 flex-1 items-center justify-center border border-rose-gold bg-rose-gold text-sm tracking-[0.16em] text-cream transition-colors hover:bg-rose-gold-light disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none sm:px-10"
          >
            {ctaLabel}
          </button>
          <button
            type="button"
            onClick={() =>
              toggle({
                productId: product.id,
                slug: product.slug,
                name: product.name,
                image: product.image,
                price: product.price,
              })
            }
            className={cn(
              "inline-flex min-h-12 items-center justify-center border px-5 text-sm tracking-[0.12em] transition-colors",
              wished
                ? "border-rose-gold text-rose-gold"
                : "border-line text-ink-muted hover:border-rose-gold hover:text-rose-gold"
            )}
          >
            {wished ? "Nos favoritos" : "Favoritar"}
          </button>
        </div>

        {(message || cartError) && (
          <p
            className={cn(
              "mt-3 hidden text-xs sm:block",
              message ? "text-earth" : "text-rose-gold"
            )}
          >
            {message ?? cartError}
          </p>
        )}

        {product.description ? (
          <div className="mt-10 border-t border-line pt-8">
            <h2 className="font-display text-lg tracking-[0.06em] text-ink">
              Detalhes
            </h2>
            <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-muted">
              {product.description}
            </div>
          </div>
        ) : null}

        {product.highlights.length > 0 ? (
          <ul className="mt-6 space-y-2 text-sm text-ink-muted">
            {product.highlights.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-rose-gold">·</span>
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {/* Mobile sticky buy bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-cream/95 px-4 pt-3 backdrop-blur-xl sm:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        {(message || cartError) && (
          <p
            className={cn(
              "mb-2 text-center text-xs",
              message ? "text-earth" : "text-rose-gold"
            )}
          >
            {message ?? cartError}
          </p>
        )}
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-ink-muted">{product.name}</p>
            <p className="font-medium text-ink">{formatPrice(product.price)}</p>
          </div>
          <button
            type="button"
            onClick={() =>
              toggle({
                productId: product.id,
                slug: product.slug,
                name: product.name,
                image: product.image,
                price: product.price,
              })
            }
            className={cn(
              "flex size-12 shrink-0 items-center justify-center border text-sm transition-colors",
              wished
                ? "border-rose-gold text-rose-gold"
                : "border-line text-ink-muted"
            )}
            aria-label={wished ? "Remover dos favoritos" : "Favoritar"}
          >
            <svg
              className="size-5"
              viewBox="0 0 24 24"
              fill={wished ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden
            >
              <path
                d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            disabled={!available || pending}
            onClick={() => void handleAdd()}
            className="inline-flex min-h-12 min-w-[9.5rem] flex-[1.4] items-center justify-center border border-rose-gold bg-rose-gold px-3 text-xs tracking-[0.12em] text-cream disabled:cursor-not-allowed disabled:opacity-40"
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
