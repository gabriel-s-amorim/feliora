import { createAdminClient } from "@/lib/supabase/admin";
import { listCategoryMaps } from "@/lib/marketplace/links";
import {
  collectImageUrls,
  parseNumber,
  parseTikTokCategory,
  type TikTokRawRow,
} from "@/lib/admin/tiktokImport/parseWorkbook";
import type {
  SingleVariationAs,
  TikTokParsedProduct,
  TikTokParsedVariant,
} from "@/lib/admin/tiktokImport/types";

const COLOR_NAMES = new Set(
  [
    "preto",
    "branco",
    "off-white",
    "off white",
    "bege",
    "creme",
    "cinza",
    "cinza claro",
    "cinza escuro",
    "azul",
    "azul marinho",
    "marinho",
    "vermelho",
    "rosa",
    "rosa claro",
    "pink",
    "verde",
    "verde militar",
    "amarelo",
    "laranja",
    "roxo",
    "lilas",
    "lilás",
    "marrom",
    "nude",
    "dourado",
    "prateado",
    "prata",
    "bordo",
    "bordô",
    "vinho",
    "caramelo",
    "terracota",
    "coral",
    "black",
    "white",
    "beige",
    "cream",
    "gray",
    "grey",
    "blue",
    "navy",
    "red",
    "green",
    "yellow",
    "orange",
    "purple",
    "brown",
    "gold",
    "silver",
    "pink",
  ].map((c) => c.toLowerCase())
);

export function suggestSingleVariationAs(values: string[]): SingleVariationAs {
  if (values.length === 0) return "size";
  const colorHits = values.filter((v) =>
    COLOR_NAMES.has(v.trim().toLowerCase())
  ).length;
  return colorHits >= Math.ceil(values.length / 2) ? "color" : "size";
}

export function splitVariationValue(raw: string): string[] {
  return raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
}

export function resolveVariationParts(
  parts: string[],
  singleAs: SingleVariationAs
): { sizeLabel: string; colorName: string } {
  if (parts.length === 0) {
    return { sizeLabel: "U", colorName: "" };
  }
  if (parts.length === 1) {
    if (singleAs === "color") {
      return { sizeLabel: "U", colorName: parts[0] };
    }
    return { sizeLabel: parts[0], colorName: "" };
  }
  return { colorName: parts[0], sizeLabel: parts[1] };
}

function groupRows(rows: TikTokRawRow[]): Map<string, TikTokRawRow[]> {
  const map = new Map<string, TikTokRawRow[]>();
  for (const row of rows) {
    const key = row.product_id || `name:${row.product_name}`;
    const list = map.get(key) ?? [];
    list.push(row);
    map.set(key, list);
  }
  return map;
}

function buildVariants(
  rows: TikTokRawRow[],
  singleAs: SingleVariationAs
): TikTokParsedVariant[] {
  return rows.map((row) => {
    const parts = splitVariationValue(row.variation_value);
    const { sizeLabel, colorName } = resolveVariationParts(parts, singleAs);
    return {
      skuId: row.sku_id,
      sellerSku: row.seller_sku,
      variationValue: row.variation_value,
      price: parseNumber(row.price) ?? 0,
      quantity: Math.max(0, Math.floor(parseNumber(row.quantity) ?? 0)),
      sizeLabel,
      colorName,
    };
  });
}

/**
 * Agrupa linhas por product_id e resolve categoria/duplicata para o preview.
 */
export async function buildPreviewProducts(
  rows: TikTokRawRow[]
): Promise<TikTokParsedProduct[]> {
  const groups = groupRows(rows);
  const categoryMaps = await listCategoryMaps("tiktok");
  const byExternal = new Map(
    categoryMaps
      .filter((m) => m.externalCategoryId)
      .map((m) => [m.externalCategoryId, m])
  );

  const supabase = createAdminClient();
  const tiktokIds = [...groups.keys()].filter((k) => !k.startsWith("name:"));

  const { data: linkRows } = await supabase
    .from("marketplace_product_links")
    .select("product_id, external_item_id")
    .eq("channel", "tiktok")
    .in("external_item_id", tiktokIds.length ? tiktokIds : ["__none__"]);

  const linkByExternal = new Map(
    ((linkRows ?? []) as Array<{ product_id: number; external_item_id: string }>).map(
      (l) => [l.external_item_id, l.product_id]
    )
  );

  const allSellerSkus = [
    ...new Set(
      rows.map((r) => r.seller_sku.trim()).filter((s) => s.length > 0)
    ),
  ];

  const skuToProductId = new Map<string, number>();
  if (allSellerSkus.length > 0) {
    const { data: variantRows } = await supabase
      .from("product_variants")
      .select("product_id, sku")
      .in("sku", allSellerSkus);
    for (const v of (variantRows ?? []) as Array<{
      product_id: number;
      sku: string;
    }>) {
      if (v.sku) skuToProductId.set(v.sku.toLowerCase(), v.product_id);
    }
  }

  const products: TikTokParsedProduct[] = [];

  for (const [tiktokProductId, group] of groups) {
    const first = group[0];
    const cat = parseTikTokCategory(first.category);
    const mapped = cat.code ? byExternal.get(cat.code) : undefined;

    // Imagens são metadados do produto e se repetem em cada linha/SKU.
    // Usar apenas a primeira linha impede agregar mídias divergentes ou
    // frames repetidos encontrados em linhas de variantes.
    const imageUrls = collectImageUrls(first);

    const dimParts = group.map((r) => splitVariationValue(r.variation_value));
    const maxParts = Math.max(0, ...dimParts.map((p) => p.length));
    const singleDimVariation = maxParts <= 1;
    const uniqueSingleValues = [
      ...new Set(dimParts.flatMap((p) => (p.length === 1 ? p : []))),
    ];
    const suggestedSingleVariationAs = suggestSingleVariationAs(
      uniqueSingleValues
    );

    const variants = buildVariants(group, suggestedSingleVariationAs);
    const prices = variants.map((v) => v.price).filter((p) => p > 0);
    const uniquePrices = [...new Set(prices.map((p) => Number(p.toFixed(2))))];
    const priceVaries = uniquePrices.length > 1;
    const price =
      uniquePrices.length > 0 ? Math.min(...uniquePrices) : 0;

    const weightG = parseNumber(first.parcel_weight);
    const lengthCm = parseNumber(first.parcel_length);
    const widthCm = parseNumber(first.parcel_width);
    const heightCm = parseNumber(first.parcel_height);

    let matchedBy: "product_id" | "seller_sku" | null = null;
    let felioraProductId: number | null = null;

    const byLink = linkByExternal.get(tiktokProductId);
    if (byLink) {
      matchedBy = "product_id";
      felioraProductId = byLink;
    } else {
      for (const v of variants) {
        if (!v.sellerSku) continue;
        const found = skuToProductId.get(v.sellerSku.toLowerCase());
        if (found) {
          matchedBy = "seller_sku";
          felioraProductId = found;
          break;
        }
      }
    }

    products.push({
      tiktokProductId,
      name: first.product_name,
      description: first.product_description,
      categoryRaw: first.category,
      categoryCode: cat.code,
      categoryName: cat.name,
      categoryId: mapped?.felioraCategoryId ?? null,
      categoryMapped: Boolean(mapped),
      price,
      priceVaries,
      prices: uniquePrices,
      totalStock: variants.reduce((sum, v) => sum + v.quantity, 0),
      imageUrls,
      mainImageUrl: imageUrls[0] ?? "",
      weightKg: weightG !== null ? weightG / 1000 : null,
      lengthCm,
      widthCm,
      heightCm,
      variants,
      singleDimVariation,
      suggestedSingleVariationAs,
      duplicate: { matchedBy, felioraProductId },
      defaultAction: matchedBy ? "skip" : "create",
    });
  }

  return products;
}

export function rebuildVariantsWithDimension(
  product: TikTokParsedProduct,
  singleAs: SingleVariationAs
): TikTokParsedVariant[] {
  return product.variants.map((v) => {
    const parts = splitVariationValue(v.variationValue);
    const { sizeLabel, colorName } = resolveVariationParts(parts, singleAs);
    return { ...v, sizeLabel, colorName };
  });
}
