"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-ink/40"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        aria-label={product.name}
        className="relative z-10 flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-md border border-line bg-cream sm:mx-4 sm:max-h-[85vh] sm:flex-row sm:rounded-md"
      >
        <div className="relative aspect-[3/4] w-full shrink-0 bg-ivory sm:aspect-auto sm:w-1/2">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 50vw"
            />
          ) : null}
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto p-5 sm:p-7">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex size-10 items-center justify-center text-ink-muted hover:text-ink"
            aria-label="Fechar"
          >
            ✕
          </button>

          <p className="text-[10px] uppercase tracking-[0.18em] text-earth">
            {product.category?.name}
          </p>
          <h2 className="mt-2 font-display text-2xl font-light tracking-[0.04em] text-ink">
            {product.name}
          </h2>
          <p className="mt-2 text-sm text-ink">{formatPrice(product.price)}</p>

          <div className="mt-6">
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

          <div className="mt-auto flex flex-col gap-2 pt-8">
            <button
              type="button"
              disabled={!available || pending}
              onClick={() => void handleAdd()}
              className="inline-flex min-h-12 items-center justify-center border border-rose-gold bg-rose-gold text-sm tracking-[0.14em] text-cream transition-colors hover:bg-rose-gold-light disabled:opacity-40"
            >
              {pending ? "Adicionando…" : "Adicionar ao carrinho"}
            </button>
            <Link
              href={`/produto/${product.slug}`}
              className="inline-flex min-h-11 items-center justify-center text-sm tracking-[0.12em] text-ink-muted hover:text-rose-gold"
              onClick={onClose}
            >
              Ver produto completo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
