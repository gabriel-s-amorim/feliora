"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/shared/types/product";
import { cn, formatPrice } from "@/lib/utils";
import { useWishlist } from "@/contexts/WishlistContext";

type Props = {
  product: Product;
  priority?: boolean;
  className?: string;
  /** sizes tip para o next/image */
  sizes?: string;
};

export function LookbookProductTile({
  product,
  priority = false,
  className,
  sizes = "(max-width: 768px) 100vw, 50vw",
}: Props) {
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
      className={cn("group relative min-h-0 overflow-hidden bg-ivory", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link
        href={`/produto/${product.slug}`}
        className="absolute inset-0 block"
        aria-label={product.name}
      >
        {product.image ? (
          <>
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes={sizes}
              priority={priority}
                className={cn(
                  "object-cover transition-[transform,opacity] duration-700 ease-out group-hover:scale-[1.04]",
                  showSecondary ? "opacity-0" : "opacity-100"
                )}
            />
            {secondary ? (
              <Image
                src={secondary}
                alt=""
                fill
                sizes={sizes}
                className={cn(
                  "object-cover transition-opacity duration-500",
                  showSecondary ? "opacity-100" : "opacity-0"
                )}
              />
            ) : null}
          </>
        ) : (
          <div className="flex h-full items-center justify-center bg-cream">
            <span className="font-display text-sm tracking-[0.2em] text-ink-muted">
              Feliora
            </span>
          </div>
        )}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/10 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-95"
          aria-hidden
        />
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
          "absolute right-3 top-3 z-10 flex size-9 items-center justify-center text-sm transition-colors",
          wished
            ? "text-rose-gold"
            : "text-cream/90 hover:text-cream"
        )}
      >
        {wished ? "♥" : "♡"}
      </button>

      {(product.badge || product.isNew) && (
        <span className="pointer-events-none absolute left-3 top-3 z-10 text-[10px] uppercase tracking-[0.2em] text-cream/90">
          {product.badge || "Novidade"}
        </span>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-4 sm:p-5 md:p-6">
        <Link
          href={`/produto/${product.slug}`}
          className="pointer-events-auto block"
        >
          <p className="font-display text-lg font-light leading-tight tracking-[0.04em] text-cream sm:text-xl md:text-[1.35rem]">
            {product.name}
          </p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <p className="text-[11px] tracking-[0.14em] text-cream/85 sm:text-xs">
              {formatPrice(product.price)}
            </p>
            {product.originalPrice != null &&
            product.originalPrice > product.price ? (
              <p className="text-[10px] tracking-[0.08em] text-cream/55 line-through">
                {formatPrice(product.originalPrice)}
              </p>
            ) : null}
          </div>
        </Link>
      </div>
    </article>
  );
}
