"use client";

import Image from "next/image";
import Link from "next/link";
import { useWishlist } from "@/contexts/WishlistContext";
import { EmptyState } from "@/components/store/EmptyState";
import { formatPrice } from "@/lib/utils";

export function FavoritosPageClient() {
  const { items, remove, clear } = useWishlist();

  if (items.length === 0) {
    return (
      <EmptyState
        title="Nenhum favorito ainda"
        description="Toque em Favoritar nas peças que você ama — salvamos aqui neste aparelho."
        actionHref="/catalogo"
        actionLabel="Explorar catálogo"
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.35em] text-rose-gold">
            Wishlist
          </p>
          <h1 className="mt-3 font-display text-3xl font-light tracking-[0.06em] text-ink">
            Favoritos
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            {items.length} {items.length === 1 ? "peça" : "peças"} · salvos
            neste dispositivo
          </p>
        </div>
        <button
          type="button"
          onClick={clear}
          className="text-xs tracking-wide text-ink-muted hover:text-rose-gold"
        >
          Limpar
        </button>
      </header>

      <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <li key={item.productId}>
            <Link
              href={`/produto/${item.slug}`}
              className="relative block aspect-[3/4] overflow-hidden bg-ivory"
            >
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
              ) : null}
            </Link>
            <div className="mt-3 flex items-start justify-between gap-2">
              <div>
                <Link
                  href={`/produto/${item.slug}`}
                  className="font-display text-base tracking-[0.04em] text-ink hover:text-rose-gold"
                >
                  {item.name}
                </Link>
                <p className="mt-1 text-sm text-ink">
                  {formatPrice(item.price)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(item.productId)}
                className="text-[11px] tracking-wide text-ink-muted hover:text-rose-gold"
              >
                Remover
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
