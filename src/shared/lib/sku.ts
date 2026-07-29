const MAX_SKU_LENGTH = 64;

function skuPart(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Gera SKU no padrão `{slug}-{tamanho}-{cor}`.
 *
 * O sufixo da variante é preservado ao limitar a 64 caracteres. Truncar a
 * string completa fazia produtos com slugs longos gerarem o mesmo SKU para
 * todas as combinações.
 */
export function skuFor(slug: string, size: string, color: string): string {
  const base = skuPart(slug) || "sku";
  const variant = [size, color].map(skuPart).filter(Boolean).join("-");

  if (!variant) return base.slice(0, MAX_SKU_LENGTH);

  const suffix = variant.slice(0, MAX_SKU_LENGTH - 5);
  const baseLength = Math.max(4, MAX_SKU_LENGTH - suffix.length - 1);
  return `${base.slice(0, baseLength)}-${suffix}`.slice(0, MAX_SKU_LENGTH);
}
