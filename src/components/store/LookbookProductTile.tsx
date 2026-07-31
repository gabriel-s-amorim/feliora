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
  sizes?: string;
};

/** Tile de lookbook: imagem em primeiro plano, quase sem texto. */
export function LookbookProductTile({
  product,
  priority = false,
  className,
  sizes = "(max-width: 768px) 50vw, 33vw",
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
      className={cn("group relative overflow-hidden bg-ivory", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link
        href={`/produto/${product.slug}`}
        className="absolute inset-0 block"
        aria-label={`${product.name} — ${formatPrice(product.price)}`}
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
                  "object-cover object-center transition-[transform,opacity] duration-700 ease-out group-hover:scale-[1.02]",
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
                    "object-cover object-center transition-opacity duration-500",
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
          className="absolute inset-0 bg-ink/0 transition-colors duration-500 group-hover:bg-ink/25"
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
          "absolute right-2.5 top-2.5 z-10 flex size-8 items-center justify-center text-sm transition-all duration-300",
          wished
            ? "text-rose-gold opacity-100"
            : "text-cream/90 opacity-70 md:opacity-0 md:group-hover:opacity-100"
        )}
      >
        {wished ? "♥" : "♡"}
      </button>

      {/* Desktop: nome médio; no hover, só o preço */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden bg-gradient-to-t from-ink/50 via-ink/15 to-transparent px-3.5 pb-3.5 pt-12 md:block">
        <div className="relative min-h-[2.5rem]">
          <p className="line-clamp-2 font-display text-[0.9rem] font-light leading-snug tracking-[0.03em] text-cream transition-opacity duration-300 group-hover:opacity-0">
            {product.name}
          </p>
          <p className="absolute inset-x-0 bottom-0 text-[11px] tracking-[0.14em] text-cream opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            {formatPrice(product.price)}
            {product.originalPrice != null &&
            product.originalPrice > product.price ? (
              <span className="ml-2 text-[10px] text-cream/55 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            ) : null}
          </p>
        </div>
      </div>

      {/* Mobile: nome + preço, sem exagero */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-ink/55 via-ink/20 to-transparent px-2.5 pb-2.5 pt-10 md:hidden">
        <p className="line-clamp-2 font-display text-[0.7rem] font-light leading-snug tracking-[0.02em] text-cream">
          {product.name}
        </p>
        <p className="mt-0.5 text-[10px] tracking-[0.1em] text-cream/80">
          {formatPrice(product.price)}
          {product.originalPrice != null &&
          product.originalPrice > product.price ? (
            <span className="ml-1.5 text-[9px] text-cream/50 line-through">
              {formatPrice(product.originalPrice)}
            </span>
          ) : null}
        </p>
      </div>
    </article>
  );
}
