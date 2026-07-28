import type { ProductSort } from "@/lib/products";

export function parseCatalogSearchParams(
  sp: Record<string, string | string[] | undefined>
) {
  const get = (key: string) => {
    const v = sp[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const sortRaw = get("ordem") ?? "newest";
  const sort = (
    ["newest", "price_asc", "price_desc", "featured", "name"] as ProductSort[]
  ).includes(sortRaw as ProductSort)
    ? (sortRaw as ProductSort)
    : "newest";

  const min = get("min");
  const max = get("max");

  return {
    categorySlug: get("categoria") || undefined,
    size: get("tamanho") || undefined,
    color: get("cor") || undefined,
    sort,
    minPrice: min ? Number(min) : undefined,
    maxPrice: max ? Number(max) : undefined,
    q: get("q") || undefined,
  };
}
