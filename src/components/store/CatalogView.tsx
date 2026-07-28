"use client";

import { useState } from "react";
import type { Product } from "@/shared/types/product";
import type { CategoryNavItem } from "@/shared/types/category";
import { ProductCard } from "@/components/store/ProductCard";
import { QuickView } from "@/components/store/QuickView";
import {
  FilterSheet,
  type CatalogFacets,
} from "@/components/store/FilterSheet";
import { EmptyState } from "@/components/store/EmptyState";

type CatalogViewProps = {
  products: Product[];
  categories: CategoryNavItem[];
  facets: CatalogFacets;
  basePath?: string;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function CatalogView({
  products,
  categories,
  facets,
  basePath = "/catalogo",
  emptyTitle = "Nenhuma peça por aqui",
  emptyDescription = "Ainda não há produtos cadastrados, ou nenhum corresponde aos filtros.",
}: CatalogViewProps) {
  const [quickView, setQuickView] = useState<Product | null>(null);

  return (
    <div>
      <div className="mb-8">
        <FilterSheet
          categories={categories}
          facets={facets}
          basePath={basePath}
        />
      </div>

      {products.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          actionHref="/"
          actionLabel="Voltar à home"
        />
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
          {products.map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={i < 4}
              onQuickView={setQuickView}
            />
          ))}
        </div>
      )}

      <QuickView
        product={quickView}
        open={Boolean(quickView)}
        onClose={() => setQuickView(null)}
      />
    </div>
  );
}
