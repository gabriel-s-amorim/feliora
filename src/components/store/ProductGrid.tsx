import { ProductCard } from "@/components/store/ProductCard";
import type { Product } from "@/shared/types/product";
import { cn } from "@/lib/utils";

type ProductGridProps = {
  products: Product[];
  onQuickView?: (product: Product) => void;
  priorityCount?: number;
  className?: string;
};

/**
 * Grid editorial: gap generoso e largura limitada quando há poucos itens,
 * para o card não boiar sozinho numa faixa enorme.
 */
export function ProductGrid({
  products,
  onQuickView,
  priorityCount = 4,
  className,
}: ProductGridProps) {
  const count = products.length;
  if (count === 0) return null;

  return (
    <div
      className={cn(
        "grid w-full",
        count === 1 &&
          "mx-auto max-w-[17.5rem] grid-cols-1 gap-y-10 sm:max-w-[20rem]",
        count === 2 &&
          "mx-auto max-w-xl grid-cols-2 gap-x-5 gap-y-12 sm:max-w-2xl sm:gap-x-10 md:gap-y-14",
        count === 3 &&
          "mx-auto max-w-3xl grid-cols-2 gap-x-5 gap-y-12 sm:max-w-4xl sm:gap-x-8 md:grid-cols-3 md:gap-x-10 md:gap-y-14",
        count >= 4 &&
          "grid-cols-2 gap-x-5 gap-y-12 sm:gap-x-8 md:grid-cols-3 md:gap-y-14 lg:grid-cols-4 lg:gap-x-10",
        className
      )}
    >
      {products.map((product, i) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={i < priorityCount}
          onQuickView={onQuickView}
        />
      ))}
    </div>
  );
}
