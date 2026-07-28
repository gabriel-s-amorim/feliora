import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CatalogView } from "@/components/store/CatalogView";
import { ProductGridSkeleton } from "@/components/store/ProductSkeleton";
import { getCategoryBySlug, listActiveCategoryNav } from "@/lib/categories";
import { parseCatalogSearchParams } from "@/lib/catalogParams";
import {
  extractFilterFacets,
  listProductsByCategorySlug,
} from "@/lib/products";

export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Categoria" };

  return {
    title: category.seoTitle || category.name,
    description:
      category.seoDescription ||
      category.description ||
      `Peças da categoria ${category.name} na Feliora.`,
  };
}

export default async function CategoriaPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const sp = await searchParams;
  const filters = parseCatalogSearchParams(sp);
  const categories = await listActiveCategoryNav();

  const allForFacets = await listProductsByCategorySlug(slug, { limit: 120 });
  const facets = extractFilterFacets(allForFacets);

  const products = await listProductsByCategorySlug(slug, {
    size: filters.size,
    color: filters.color,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    sort: filters.sort,
    limit: 48,
  });

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
      <header className="mb-12 text-center sm:mb-16">
        <p className="font-display text-[0.65rem] uppercase tracking-[0.42em] text-rose-gold sm:text-xs">
          Categoria
        </p>
        <h1 className="mt-4 font-display text-4xl font-light tracking-[0.08em] text-ink sm:text-5xl md:text-[3.25rem]">
          {category.name}
        </h1>
        {category.description ? (
          <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-ink-muted sm:text-base">
            {category.description}
          </p>
        ) : (
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-ink-muted">
            {products.length}{" "}
            {products.length === 1 ? "peça" : "peças"} nesta seleção
          </p>
        )}
      </header>

      <Suspense fallback={<ProductGridSkeleton />}>
        <CatalogView
          products={products}
          categories={categories}
          facets={facets}
          basePath={`/categoria/${slug}`}
          emptyTitle="Sem peças nesta categoria"
          emptyDescription="Cadastre produtos vinculados a esta categoria no admin."
        />
      </Suspense>
    </section>
  );
}
