import type { MetadataRoute } from "next";
import { SEO_STATIC_PATHS } from "@/shared/const/site";
import { absoluteUrl, getCanonicalSiteOrigin } from "@/lib/seo/metadata";
import {
  createPublicClient,
  hasSupabasePublicEnv,
} from "@/lib/supabase/public";

export const revalidate = 3600;

type SitemapRow = {
  slug: string;
  updated_at: string | null;
  image?: string | null;
};

async function fetchSitemapRows(): Promise<{
  products: SitemapRow[];
  categories: SitemapRow[];
  pages: SitemapRow[];
}> {
  if (!hasSupabasePublicEnv()) {
    return { products: [], categories: [], pages: [] };
  }

  try {
    const supabase = createPublicClient();
    const [productsRes, categoriesRes, pagesRes] = await Promise.all([
      supabase
        .from("products")
        .select("slug, updated_at, image")
        .eq("is_active", true)
        .order("updated_at", { ascending: false }),
      supabase
        .from("categories")
        .select("slug, updated_at")
        .eq("is_active", true),
      supabase
        .from("content_pages")
        .select("slug, updated_at")
        .eq("is_published", true),
    ]);

    return {
      products: (productsRes.data as SitemapRow[] | null) ?? [],
      categories: (categoriesRes.data as SitemapRow[] | null) ?? [],
      pages: (pagesRes.data as SitemapRow[] | null) ?? [],
    };
  } catch {
    return { products: [], categories: [], pages: [] };
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getCanonicalSiteOrigin();
  const now = new Date();
  const { products, categories, pages } = await fetchSitemapRows();

  const staticEntries: MetadataRoute.Sitemap = SEO_STATIC_PATHS.map(
    (entry) => ({
      url: absoluteUrl(entry.path),
      lastModified: now,
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
    })
  );

  const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
    url: absoluteUrl(`/categoria/${c.slug}`),
    lastModified: c.updated_at ? new Date(c.updated_at) : now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const pageEntries: MetadataRoute.Sitemap = pages
    .filter(
      (p) =>
        !SEO_STATIC_PATHS.some((s) => s.path === `/pages/${p.slug}`)
    )
    .map((p) => ({
      url: absoluteUrl(`/pages/${p.slug}`),
      lastModified: p.updated_at ? new Date(p.updated_at) : now,
      changeFrequency: "monthly",
      priority: 0.5,
    }));

  const productEntries: MetadataRoute.Sitemap = products.map((p) => {
    const images =
      p.image && p.image.startsWith("http")
        ? [p.image]
        : p.image
          ? [`${origin}${p.image.startsWith("/") ? p.image : `/${p.image}`}`]
          : undefined;

    return {
      url: absoluteUrl(`/produto/${p.slug}`),
      lastModified: p.updated_at ? new Date(p.updated_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      ...(images ? { images } : {}),
    };
  });

  return [
    ...staticEntries,
    ...categoryEntries,
    ...pageEntries,
    ...productEntries,
  ];
}
