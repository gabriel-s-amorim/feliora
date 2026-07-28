"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/shared/types/product";
import { cn, formatPrice } from "@/lib/utils";
import { useWishlist } from "@/contexts/WishlistContext";

type ProductCardProps = {
  product: Product;
  onQuickView?: (product: Product) => void;
  priority?: boolean;
};

export function ProductCard({
  product,
  onQuickView,
  priority = false,
}: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const { has, toggle } = useWishlist();
  const wished = has(product.id);
  const secondary =
    product.images[0] && product.images[0] !== product.image
      ? product.images[0]
      : product.images[1];
  const showSecondary = hovered && Boolean(secondary);

  return (
    <article
      className="group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-ivory">
        <Link
          href={`/produto/${product.slug}`}
          className="absolute inset-0 block"
        >
          {product.image ? (
            <>
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                priority={priority}
                className={cn(
                  "object-cover transition-opacity duration-500",
                  showSecondary ? "opacity-0" : "opacity-100"
                )}
              />
              {secondary ? (
                <Image
                  src={secondary}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className={cn(
                    "object-cover transition-opacity duration-500",
                    showSecondary ? "opacity-100" : "opacity-0"
                  )}
                />
              ) : null}
            </>
          ) : (
            <div className="flex h-full items-center justify-center border border-line bg-cream">
              <span className="font-display text-xs tracking-[0.2em] text-ink-muted">
                Feliora
              </span>
            </div>
          )}
        </Link>

        <button
          type="button"
          aria-label={wished ? "Remover dos favoritos" : "Favoritar"}
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
            "absolute right-2 top-2 z-10 flex size-9 items-center justify-center bg-cream/95 text-sm transition-colors",
            wished ? "text-rose-gold" : "text-ink-muted hover:text-rose-gold"
          )}
        >
          {wished ? "♥" : "♡"}
        </button>

        {(product.badge || product.isNew) && (
          <span className="pointer-events-none absolute left-2 top-2 max-w-[70%] bg-cream/95 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-rose-gold">
            {product.badge || "Novidade"}
          </span>
        )}

        {onQuickView ? (
          <button
            type="button"
            onClick={() => onQuickView(product)}
            className="absolute inset-x-2 bottom-2 z-10 min-h-10 border border-cream/40 bg-cream/95 text-[11px] tracking-[0.16em] text-ink opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
          >
            Visualização rápida
          </button>
        ) : null}
      </div>

      <div className="mt-4 space-y-1.5 px-0.5 sm:mt-5">
        {product.category ? (
          <p className="text-[10px] uppercase tracking-[0.18em] text-earth">
            {product.category.name}
          </p>
        ) : null}
        <Link
          href={`/produto/${product.slug}`}
          className="block font-display text-[0.95rem] tracking-[0.04em] text-ink transition-colors hover:text-rose-gold sm:text-lg"
        >
          {product.name}
        </Link>
        <div className="flex items-baseline gap-2 pt-0.5">
          <p className="text-sm text-ink">{formatPrice(product.price)}</p>
          {product.originalPrice != null &&
          product.originalPrice > product.price ? (
            <p className="text-xs text-ink-muted line-through">
              {formatPrice(product.originalPrice)}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
