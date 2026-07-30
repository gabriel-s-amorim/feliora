"use client";

import { useMemo } from "react";
import type { Product } from "@/shared/types/product";
import { cn } from "@/lib/utils";
import { productColorBackground } from "@/shared/lib/productColor";

type VariantSelectorProps = {
  product: Product;
  size: string;
  color: string;
  onSizeChange: (size: string) => void;
  onColorChange: (color: string) => void;
};

export function VariantSelector({
  product,
  size,
  color,
  onSizeChange,
  onColorChange,
}: VariantSelectorProps) {
  const variants = useMemo(
    () => (product.variants ?? []).filter((v) => v.isActive),
    [product.variants]
  );

  const sizes = useMemo(() => {
    const fromMeta = product.sizes.map((s) => s.label);
    const fromVariants = variants.map((v) => v.sizeLabel);
    return [...new Set([...fromMeta, ...fromVariants])];
  }, [product.sizes, variants]);

  const colors = useMemo(() => {
    const names = [
      ...product.colors.map((c) => c.name),
      ...variants.map((v) => v.colorName).filter(Boolean),
    ];
    return [...new Set(names)];
  }, [product.colors, variants]);

  function sizeAvailable(label: string) {
    return variants.some(
      (v) =>
        v.sizeLabel === label &&
        (!color || v.colorName === color) &&
        v.stockCount > 0
    );
  }

  function colorAvailable(name: string) {
    return variants.some(
      (v) =>
        v.colorName === name &&
        (!size || v.sizeLabel === size) &&
        v.stockCount > 0
    );
  }

  function colorBackground(name: string) {
    const fallback =
      product.colors.find((c) => c.name.toLowerCase() === name.toLowerCase())
        ?.hex ?? "#8C7B6A";
    return productColorBackground(name, fallback);
  }

  return (
    <div className="space-y-8">
      {sizes.length > 0 ? (
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-earth">
            Tamanho
          </p>
          <div className="mt-3.5 flex flex-wrap gap-2.5">
            {sizes.map((label) => {
              const ok = sizeAvailable(label);
              const selected = size === label;
              return (
                <button
                  key={label}
                  type="button"
                  disabled={!ok && !selected}
                  onClick={() => onSizeChange(label)}
                  className={cn(
                    "min-h-11 min-w-11 border px-3 text-sm tracking-wide transition-colors",
                    selected
                      ? "border-rose-gold bg-rose-gold text-cream"
                      : ok
                        ? "border-line text-ink hover:border-rose-gold"
                        : "border-line/50 text-ink-muted line-through opacity-50"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {colors.length > 0 ? (
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-earth">
            Cor{color ? ` — ${color}` : ""}
          </p>
          <div className="mt-3.5 flex flex-wrap gap-3">
            {colors.map((name) => {
              const ok = colorAvailable(name);
              const selected = color === name;
              return (
                <button
                  key={name}
                  type="button"
                  title={name}
                  disabled={!ok && !selected}
                  onClick={() => onColorChange(name)}
                  className={cn(
                    "size-9 rounded-full border-2 transition-transform",
                    selected
                      ? "border-rose-gold scale-110"
                      : "border-transparent",
                    !ok && "opacity-40"
                  )}
                  style={{
                    background: colorBackground(name),
                    boxShadow: "inset 0 0 0 1px rgba(28, 28, 28, 0.16)",
                  }}
                  aria-label={name}
                />
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
