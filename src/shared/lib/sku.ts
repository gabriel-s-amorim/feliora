/** Gera SKU no padrão do form manual: `{slug}-{tamanho}-{cor}` (máx. 64). */
export function skuFor(slug: string, size: string, color: string): string {
  const base = slug || "sku";
  const parts = [base, size, color]
    .filter(Boolean)
    .map((p) =>
      p
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    );
  return parts.join("-").slice(0, 64);
}
