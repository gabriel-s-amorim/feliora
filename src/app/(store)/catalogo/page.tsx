import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogView } from "@/components/store/CatalogView";
import { ProductGridSkeleton } from "@/components/store/ProductSkeleton";
import { listActiveCategoryNav } from "@/lib/categories";
import { parseCatalogSearchParams } from "@/lib/catalogParams";
import {
  extractFilterFacets,
  listActiveProducts,
} from "@/lib/products";
import { SITE_DESCRIPTION } from "@/shared/const/site";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Catálogo",
  description: `Explore a coleção ${SITE_DESCRIPTION}`,
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CatalogoPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const filters = parseCatalogSearchParams(sp);
  const categories = await listActiveCategoryNav();

  const allForFacets = await listActiveProducts({
    categorySlug: filters.categorySlug,
    limit: 120,
  });
  const facets = extractFilterFacets(allForFacets);

  const products = await listActiveProducts({
    categorySlug: filters.categorySlug,
    size: filters.size,
    color: filters.color,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    sort: filters.sort,
    limit: 48,
  });

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <header className="mb-10 max-w-xl">
        <p className="font-display text-xs uppercase tracking-[0.35em] text-rose-gold">
          Coleção
        </p>
        <h1 className="mt-3 font-display text-3xl font-light tracking-[0.06em] text-ink sm:text-4xl">
          Catálogo
        </h1>
        <p className="mt-3 text-sm text-ink-muted">
          {products.length}{" "}
          {products.length === 1 ? "peça" : "peças"}
          {filters.categorySlug
            ? ` em ${categories.find((c) => c.slug === filters.categorySlug)?.name ?? "categoria"}`
            : ""}
        </p>
      </header>

      <Suspense fallback={<ProductGridSkeleton />}>
        <CatalogView
          products={products}
          categories={categories}
          facets={facets}
          basePath="/catalogo"
        />
      </Suspense>
    </section>
  );
}
