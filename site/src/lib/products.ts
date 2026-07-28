import {
  mapProduct,
  type ProductRow,
} from "@/shared/lib/productMapper";
import type { Product } from "@/shared/types/product";
import {
  createPublicClient,
  hasSupabasePublicEnv,
} from "@/lib/supabase/public";

const PRODUCT_SELECT = `
  *,
  categories ( id, slug, name ),
  product_variants ( * )
`;

export type ProductSort =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "featured"
  | "name";

export type ProductListFilters = {
  categorySlug?: string;
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  isNew?: boolean;
  sort?: ProductSort;
  limit?: number;
  query?: string;
};

function applyClientFilters(
  products: Product[],
  filters: ProductListFilters
): Product[] {
  let result = products;

  if (filters.size) {
    const size = filters.size.toLowerCase();
    result = result.filter((p) =>
      (p.variants ?? []).some(
        (v) => v.isActive && v.sizeLabel.toLowerCase() === size
      )
    );
  }

  if (filters.color) {
    const color = filters.color.toLowerCase();
    result = result.filter((p) =>
      (p.variants ?? []).some(
        (v) => v.isActive && v.colorName.toLowerCase() === color
      )
    );
  }

  if (filters.minPrice != null) {
    result = result.filter((p) => p.price >= filters.minPrice!);
  }

  if (filters.maxPrice != null) {
    result = result.filter((p) => p.price <= filters.maxPrice!);
  }

  switch (filters.sort) {
    case "price_asc":
      result = [...result].sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      result = [...result].sort((a, b) => b.price - a.price);
      break;
    case "featured":
      result = [...result].sort(
        (a, b) => Number(b.featured) - Number(a.featured) || b.id - a.id
      );
      break;
    case "name":
      result = [...result].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
      break;
    case "newest":
    default:
      result = [...result].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  return result;
}

export async function listActiveProducts(
  filters: ProductListFilters = {}
): Promise<Product[]> {
  if (!hasSupabasePublicEnv()) return [];

  const limit = filters.limit ?? 48;

  try {
    const supabase = createPublicClient();
    let query = supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("is_active", true);

    if (filters.featured) query = query.eq("featured", true);
    if (filters.isNew) query = query.eq("is_new", true);

    if (filters.categorySlug) {
      const { data: category } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", filters.categorySlug)
        .eq("is_active", true)
        .maybeSingle();

      if (!category) return [];
      query = query.eq("category_id", category.id);
    }

    if (filters.query?.trim()) {
      const q = filters.query.trim().replace(/[%_,]/g, " ");
      query = query.or(
        `name.ilike.%${q}%,short_description.ilike.%${q}%`
      );
    }

    query = query.order("created_at", { ascending: false }).limit(120);

    const { data, error } = await query;

    if (error || !data) {
      console.error("[products] listActiveProducts", error?.message);
      return [];
    }

    const mapped = (data as unknown as ProductRow[]).map(mapProduct);
    return applyClientFilters(mapped, filters).slice(0, limit);
  } catch (err) {
    console.error("[products] listActiveProducts", err);
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!hasSupabasePublicEnv()) return null;

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) return null;
    return mapProduct(data as unknown as ProductRow);
  } catch {
    return null;
  }
}

export async function listProductsByCategorySlug(
  categorySlug: string,
  filters: Omit<ProductListFilters, "categorySlug"> = {}
): Promise<Product[]> {
  return listActiveProducts({ ...filters, categorySlug });
}

export async function listFeaturedProducts(limit = 8): Promise<Product[]> {
  return listActiveProducts({ featured: true, sort: "newest", limit });
}

export async function searchProducts(
  q: string,
  limit = 24
): Promise<Product[]> {
  if (!q.trim()) return [];
  return listActiveProducts({ query: q, sort: "newest", limit });
}

/** Facetas úteis para filtros a partir do conjunto atual */
export function extractFilterFacets(products: Product[]) {
  const sizes = new Set<string>();
  const colors = new Map<string, string>();
  let minPrice = Number.POSITIVE_INFINITY;
  let maxPrice = 0;

  for (const product of products) {
    minPrice = Math.min(minPrice, product.price);
    maxPrice = Math.max(maxPrice, product.price);

    for (const variant of product.variants ?? []) {
      if (!variant.isActive) continue;
      sizes.add(variant.sizeLabel);
      if (variant.colorName) {
        const meta = product.colors.find(
          (c) => c.name.toLowerCase() === variant.colorName.toLowerCase()
        );
        colors.set(variant.colorName, meta?.hex ?? "#8C7B6A");
      }
    }
  }

  return {
    sizes: [...sizes].sort((a, b) => a.localeCompare(b, "pt-BR")),
    colors: [...colors.entries()].map(([name, hex]) => ({ name, hex })),
    minPrice: Number.isFinite(minPrice) ? minPrice : 0,
    maxPrice,
  };
}
