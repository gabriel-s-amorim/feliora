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
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <header className="mb-10 max-w-xl">
        <p className="font-display text-xs uppercase tracking-[0.35em] text-rose-gold">
          Categoria
        </p>
        <h1 className="mt-3 font-display text-3xl font-light tracking-[0.06em] text-ink sm:text-4xl">
          {category.name}
        </h1>
        {category.description ? (
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            {category.description}
          </p>
        ) : null}
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
