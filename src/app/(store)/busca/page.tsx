import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogView } from "@/components/store/CatalogView";
import { ProductGridSkeleton } from "@/components/store/ProductSkeleton";
import { SearchForm } from "@/components/store/SearchForm";
import { listActiveCategoryNav } from "@/lib/categories";
import { parseCatalogSearchParams } from "@/lib/catalogParams";
import { extractFilterFacets, searchProducts } from "@/lib/products";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "Busca",
    description: "Busque peças de moda feminina na loja Feliora.",
    path: "/busca",
    noIndex: true,
  }),
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BuscaPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { q } = parseCatalogSearchParams(sp);
  const query = q?.trim() ?? "";
  const categories = await listActiveCategoryNav();
  const products = query ? await searchProducts(query, 48) : [];
  const facets = extractFilterFacets(products);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <header className="mb-8 max-w-xl">
        <p className="font-display text-xs uppercase tracking-[0.35em] text-rose-gold">
          Busca
        </p>
        <h1 className="mt-3 font-display text-3xl font-light tracking-[0.06em] text-ink sm:text-4xl">
          {query ? `Resultados para “${query}”` : "Buscar peças"}
        </h1>
      </header>

      <div className="mb-10 max-w-lg">
        <SearchForm initialQuery={query} />
      </div>

      {query ? (
        <Suspense fallback={<ProductGridSkeleton />}>
          <CatalogView
            products={products}
            categories={categories}
            facets={facets}
            basePath="/busca"
            emptyTitle="Nada encontrado"
            emptyDescription="Tente outro termo ou explore o catálogo completo."
          />
        </Suspense>
      ) : null}
    </section>
  );
}
