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
      className={cn(
        "group relative flex min-h-0 flex-col overflow-hidden bg-ivory",
        className
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative min-h-0 flex-1 overflow-hidden">
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
                  "object-cover object-top transition-[transform,opacity] duration-700 ease-out group-hover:scale-[1.02]",
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
                    "object-cover object-top transition-opacity duration-500",
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
            "absolute right-2.5 top-2.5 z-10 flex size-8 items-center justify-center bg-cream/90 text-sm transition-colors",
            wished ? "text-rose-gold" : "text-ink-muted hover:text-rose-gold"
          )}
        >
          {wished ? "♥" : "♡"}
        </button>

        {(product.badge || product.isNew) && (
          <span className="pointer-events-none absolute left-2.5 top-2.5 z-10 bg-cream/90 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] text-rose-gold">
            {product.badge || "Novidade"}
          </span>
        )}

        {/* Desktop: legenda discreta sobre a imagem */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden bg-gradient-to-t from-ink/45 to-transparent px-3 pb-3 pt-10 md:block md:px-4 md:pb-4">
          <Link
            href={`/produto/${product.slug}`}
            className="pointer-events-auto block max-w-[90%]"
          >
            <p className="line-clamp-2 font-display text-sm font-light leading-snug tracking-[0.03em] text-cream">
              {product.name}
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <p className="text-[10px] tracking-[0.12em] text-cream/80">
                {formatPrice(product.price)}
              </p>
              {product.originalPrice != null &&
              product.originalPrice > product.price ? (
                <p className="text-[9px] text-cream/50 line-through">
                  {formatPrice(product.originalPrice)}
                </p>
              ) : null}
            </div>
          </Link>
        </div>
      </div>

      {/* Mobile: título fora da foto, bem menor */}
      <div className="shrink-0 bg-cream px-2.5 py-2.5 md:hidden">
        <Link href={`/produto/${product.slug}`} className="block">
          <p className="line-clamp-2 font-display text-[0.7rem] leading-snug tracking-[0.03em] text-ink">
            {product.name}
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <p className="text-[10px] tracking-[0.08em] text-ink-muted">
              {formatPrice(product.price)}
            </p>
            {product.originalPrice != null &&
            product.originalPrice > product.price ? (
              <p className="text-[9px] text-ink-muted/60 line-through">
                {formatPrice(product.originalPrice)}
              </p>
            ) : null}
          </div>
        </Link>
      </div>
    </article>
  );
}
