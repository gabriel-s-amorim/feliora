"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/shared/types/product";
import { Breadcrumb } from "@/components/store/Breadcrumb";
import { ProductGallery } from "@/components/store/ProductGallery";
import { ProductGrid } from "@/components/store/ProductGrid";
import { VariantSelector } from "@/components/store/VariantSelector";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { cn, formatPrice } from "@/lib/utils";

type ProductDetailProps = {
  product: Product;
  related?: Product[];
  descriptionHtml?: string;
  reviewsSlot?: ReactNode;
};

export function ProductDetail({
  product,
  related = [],
  descriptionHtml = "",
  reviewsSlot,
}: ProductDetailProps) {
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

  const gallery = useMemo(() => {
    const colorImage = product.colors.find(
      (item) => item.name.toLowerCase() === color.toLowerCase()
    )?.imageUrl;

    return [
      ...new Set(
        [colorImage, product.image, ...product.images].filter(
          (image): image is string => Boolean(image)
        )
      ),
    ];
  }, [color, product.colors, product.image, product.images]);

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

  const crumbs = [
    { label: "Home", href: "/" },
    ...(product.category
      ? [
          {
            label: product.category.name,
            href: `/categoria/${product.category.slug}`,
          },
        ]
      : [{ label: "Catálogo", href: "/catalogo" }]),
    { label: product.name },
  ];

  return (
    <div className="pb-28 lg:pb-0">
      <div className="mx-auto max-w-[1500px] px-4 pt-6 sm:px-6 lg:px-8 lg:pt-10">
        <Breadcrumb items={crumbs} />
      </div>

      <div className="mx-auto grid max-w-[1500px] gap-10 px-4 pt-6 sm:px-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(21rem,0.68fr)] lg:items-start lg:gap-12 lg:px-8 lg:pt-10 lg:pb-12 xl:gap-16">
        <ProductGallery name={product.name} images={gallery} />

        <div className="lg:sticky lg:top-24 lg:pt-2">
          <h1 className="font-display text-3xl font-light tracking-[0.05em] text-ink sm:text-4xl lg:text-[2.65rem] lg:leading-tight">
            {product.name}
          </h1>

          <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-2 border-b border-line/70 pb-8">
            <p className="text-lg tracking-wide text-ink">
              {formatPrice(product.price)}
            </p>
            {product.originalPrice != null &&
            product.originalPrice > product.price ? (
              <p className="text-sm text-ink-muted line-through">
                {formatPrice(product.originalPrice)}
              </p>
            ) : null}
            {product.reviewsCount > 0 ? (
              <p className="w-full text-xs tracking-[0.08em] text-ink-muted sm:ml-auto sm:w-auto">
                {product.ratingAvg.toFixed(1)} · {product.reviewsCount}{" "}
                {product.reviewsCount === 1 ? "avaliação" : "avaliações"}
              </p>
            ) : null}
          </div>

          {product.shortDescription ? (
            <p className="mt-8 max-w-md font-display text-[0.95rem] font-light leading-relaxed tracking-[0.02em] text-ink-muted sm:text-base">
              {product.shortDescription}
            </p>
          ) : null}

          <div className="mt-10 space-y-8">
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
              "mt-6 text-xs tracking-[0.12em]",
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
            <p className="mt-2 text-xs tracking-wide text-ink-muted">
              SKU {selected.sku}
            </p>
          ) : null}

          <div className="mt-10 hidden flex-col gap-3 sm:flex sm:flex-row">
            <button
              type="button"
              disabled={!available || pending}
              onClick={() => void handleAdd()}
              className="inline-flex min-h-12 flex-1 items-center justify-center border border-rose-gold bg-rose-gold text-xs tracking-[0.18em] text-cream transition-colors hover:bg-rose-gold-light disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none sm:min-w-[14rem] sm:px-10"
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
                "inline-flex min-h-12 items-center justify-center border px-5 text-xs tracking-[0.14em] transition-colors",
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
                "mt-4 hidden text-xs sm:block",
                message ? "text-earth" : "text-rose-gold"
              )}
            >
              {message ?? cartError}
            </p>
          )}

          {(descriptionHtml || product.highlights.length > 0) && (
            <section className="mt-14 border-t border-line pt-10 sm:mt-16">
              <p className="font-display text-xs uppercase tracking-[0.35em] text-rose-gold">
                Detalhes & cuidados
              </p>
              {descriptionHtml ? (
                <div
                  className="mt-5 font-display text-[0.95rem] font-light leading-[1.75] tracking-[0.01em] text-ink-muted sm:text-base [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:text-ink [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-base [&_h3]:text-ink [&_li]:pl-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_p]:mb-4 [&_p:last-child]:mb-0 [&_strong]:font-medium [&_strong]:text-ink [&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5"
                  dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                />
              ) : null}
              {product.highlights.length > 0 ? (
                <ul className="mt-8 space-y-3 border-t border-line/60 pt-8">
                  {product.highlights.map((item) => (
                    <li
                      key={item}
                      className="flex gap-3 text-sm leading-relaxed text-ink-muted"
                    >
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-rose-gold/70" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          )}
        </div>
      </div>

      {reviewsSlot}

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mb-10 text-center sm:mb-12">
          <p className="font-display text-xs uppercase tracking-[0.42em] text-rose-gold">
            Continuar olhando
          </p>
          <h2 className="mt-4 font-display text-2xl font-light tracking-[0.08em] text-ink sm:text-3xl">
            Você também pode gostar
          </h2>
        </div>
        {related.length > 0 ? (
          <ProductGrid products={related} priorityCount={0} />
        ) : (
          <p className="mx-auto max-w-sm text-center text-sm leading-relaxed text-ink-muted">
            Em breve, outras peças da coleção aparecem aqui.
          </p>
        )}
      </section>

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
