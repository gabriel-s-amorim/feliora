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
  sizes = "(max-width: 768px) 50vw, 25vw",
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
                "object-cover object-top transition-[transform,opacity] duration-700 ease-out group-hover:scale-[1.03]",
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
        <div
          className="absolute inset-0 bg-ink/0 transition-colors duration-500 group-hover:bg-ink/20"
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
          "absolute right-3 top-3 z-10 flex size-8 items-center justify-center text-sm transition-all duration-300",
          wished
            ? "text-rose-gold opacity-100"
            : "text-cream opacity-0 group-hover:opacity-100"
        )}
      >
        {wished ? "♥" : "♡"}
      </button>

      {/* Legenda só no hover — desktop clean */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 translate-y-2 px-4 pb-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 max-md:hidden">
        <p className="line-clamp-1 font-display text-[0.8rem] font-light tracking-[0.04em] text-cream">
          {product.name}
        </p>
        <p className="mt-0.5 text-[10px] tracking-[0.14em] text-cream/75">
          {formatPrice(product.price)}
        </p>
      </div>

      {/* Mobile: faixa mínima sob a foto, sem competir com a imagem */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-ink/50 to-transparent px-2.5 pb-2.5 pt-8 md:hidden">
        <p className="line-clamp-1 font-display text-[0.65rem] tracking-[0.03em] text-cream">
          {product.name}
        </p>
        <p className="mt-0.5 text-[9px] tracking-[0.1em] text-cream/70">
          {formatPrice(product.price)}
        </p>
      </div>
    </article>
  );
}
