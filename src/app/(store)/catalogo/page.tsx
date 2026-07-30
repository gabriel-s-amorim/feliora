import { Suspense } from "react";
import { CatalogView } from "@/components/store/CatalogView";
import { ProductGridSkeleton } from "@/components/store/ProductSkeleton";
import { JsonLd } from "@/components/seo/JsonLd";
import { listActiveCategoryNav } from "@/lib/categories";
import { parseCatalogSearchParams } from "@/lib/catalogParams";
import {
  extractFilterFacets,
  listActiveProducts,
} from "@/lib/products";
import { SITE_NAME } from "@/shared/const/site";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";

export const revalidate = 60;

export const metadata = buildPageMetadata({
  title: `Catálogo de Moda Feminina | ${SITE_NAME}`,
  description:
    "Explore o catálogo Feliora: vestidos, blusas e peças sofisticadas. Filtros por tamanho, cor e preço. Frete para todo o Brasil.",
  path: "/catalogo",
});

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

  const categoryName = filters.categorySlug
    ? categories.find((c) => c.slug === filters.categorySlug)?.name
    : null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Início", path: "/" },
          { name: "Catálogo", path: "/catalogo" },
        ])}
      />
      <header className="mb-12 text-center sm:mb-16">
        <p className="font-display text-[0.65rem] uppercase tracking-[0.42em] text-rose-gold sm:text-xs">
          Coleção
        </p>
        <h1 className="mt-4 font-display text-4xl font-light tracking-[0.08em] text-ink sm:text-5xl md:text-[3.25rem]">
          {categoryName ?? "Catálogo"}
        </h1>
        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-ink-muted">
          {products.length}{" "}
          {products.length === 1 ? "peça" : "peças"}
          {categoryName ? ` em ${categoryName}` : " para vestir com delicadeza"}
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
