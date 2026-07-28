import { createAdminClient } from "@/lib/supabase/admin";
import {
  mapCategoryMap,
  mapProductLink,
  type MarketplaceCategoryMapRow,
  type MarketplaceProductLinkRow,
  type MarketplaceVariantLinkRow,
} from "@/shared/lib/marketplaceMapper";
import type { MarketplaceCategoryMapInput } from "@/shared/schemas/marketplace";
import type {
  MarketplaceChannel,
  MarketplaceExportReadiness,
  MarketplaceProductLink,
} from "@/shared/types/marketplace";
import type { Product } from "@/shared/types/product";
import { getAdminProduct } from "@/lib/admin/products";

export async function listCategoryMaps(
  channel?: MarketplaceChannel
): Promise<ReturnType<typeof mapCategoryMap>[]> {
  const supabase = createAdminClient();
  let query = supabase.from("marketplace_category_maps").select("*");
  if (channel) query = query.eq("channel", channel);
  const { data, error } = await query.order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as MarketplaceCategoryMapRow[]).map(mapCategoryMap);
}

export async function upsertCategoryMap(input: MarketplaceCategoryMapInput) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("marketplace_category_maps")
    .upsert(
      {
        channel: input.channel,
        feliora_category_id: input.felioraCategoryId,
        external_category_id: input.externalCategoryId,
        external_category_name: input.externalCategoryName ?? "",
        attributes_json: input.attributesJson ?? {},
      },
      { onConflict: "channel,feliora_category_id" }
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapCategoryMap(data as MarketplaceCategoryMapRow);
}

export async function getCategoryMapForProduct(
  channel: MarketplaceChannel,
  categoryId: string | null
) {
  if (!categoryId) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("marketplace_category_maps")
    .select("*")
    .eq("channel", channel)
    .eq("feliora_category_id", categoryId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapCategoryMap(data as MarketplaceCategoryMapRow) : null;
}

export async function listProductLinks(
  productIds?: number[]
): Promise<MarketplaceProductLink[]> {
  const supabase = createAdminClient();
  let query = supabase.from("marketplace_product_links").select("*");
  if (productIds?.length) query = query.in("product_id", productIds);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as MarketplaceProductLinkRow[]).map(mapProductLink);
}

export async function getProductLink(
  channel: MarketplaceChannel,
  productId: number
): Promise<MarketplaceProductLinkRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("marketplace_product_links")
    .select("*")
    .eq("channel", channel)
    .eq("product_id", productId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as MarketplaceProductLinkRow) ?? null;
}

export async function upsertProductLink(input: {
  channel: MarketplaceChannel;
  productId: number;
  externalItemId: string;
  status: MarketplaceProductLink["status"];
  lastError?: string | null;
  remotePayload?: unknown;
}): Promise<MarketplaceProductLinkRow> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("marketplace_product_links")
    .upsert(
      {
        channel: input.channel,
        product_id: input.productId,
        external_item_id: input.externalItemId,
        status: input.status,
        last_error: input.lastError ?? null,
        last_synced_at: new Date().toISOString(),
        remote_payload: input.remotePayload ?? null,
      },
      { onConflict: "channel,product_id" }
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as MarketplaceProductLinkRow;
}

export async function upsertVariantLink(input: {
  channel: MarketplaceChannel;
  variantId: string;
  productLinkId: string;
  externalModelId?: string;
  externalSkuId?: string;
  externalSku?: string;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("marketplace_variant_links").upsert(
    {
      channel: input.channel,
      variant_id: input.variantId,
      product_link_id: input.productLinkId,
      external_model_id: input.externalModelId ?? "",
      external_sku_id: input.externalSkuId ?? "",
      external_sku: input.externalSku ?? "",
    },
    { onConflict: "channel,variant_id" }
  );
  if (error) throw new Error(error.message);
}

export async function listVariantLinksForProductLink(
  productLinkId: string
): Promise<MarketplaceVariantLinkRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("marketplace_variant_links")
    .select("*")
    .eq("product_link_id", productLinkId);
  if (error) throw new Error(error.message);
  return (data ?? []) as MarketplaceVariantLinkRow[];
}

export async function findVariantByExternalSku(
  channel: MarketplaceChannel,
  externalSku: string
): Promise<MarketplaceVariantLinkRow | null> {
  if (!externalSku) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("marketplace_variant_links")
    .select("*")
    .eq("channel", channel)
    .eq("external_sku", externalSku)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as MarketplaceVariantLinkRow) ?? null;
}

export async function findVariantByExternalSkuId(
  channel: MarketplaceChannel,
  externalSkuId: string
): Promise<MarketplaceVariantLinkRow | null> {
  if (!externalSkuId) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("marketplace_variant_links")
    .select("*")
    .eq("channel", channel)
    .eq("external_sku_id", externalSkuId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as MarketplaceVariantLinkRow) ?? null;
}

export function checkExportReadiness(
  product: Product,
  channel: MarketplaceChannel,
  hasCategoryMap: boolean
): MarketplaceExportReadiness {
  const missing: string[] = [];
  if (!product.name?.trim()) missing.push("nome");
  if (!product.description?.trim() && !product.shortDescription?.trim()) {
    missing.push("descrição");
  }
  if (!product.image && (!product.images || product.images.length === 0)) {
    missing.push("imagens");
  }
  if (!product.price || product.price <= 0) missing.push("preço");
  if (!product.weightKg || product.weightKg <= 0) missing.push("peso (kg)");
  if (!product.widthCm || !product.heightCm || !product.lengthCm) {
    missing.push("dimensões (L×A×C)");
  }
  if (!product.categoryId) missing.push("categoria Feliora");
  if (!hasCategoryMap) missing.push(`categoria ${channel} mapeada`);
  const variants = (product.variants ?? []).filter((v) => v.isActive);
  if (variants.length === 0) missing.push("variantes ativas");
  for (const v of variants) {
    if (!v.sku?.trim()) missing.push(`SKU da variante ${v.sizeLabel}/${v.colorName}`);
  }

  return {
    productId: product.id,
    ready: missing.length === 0,
    missing: [...new Set(missing)],
  };
}

export async function getExportReadiness(
  productIds: number[],
  channel: MarketplaceChannel
): Promise<MarketplaceExportReadiness[]> {
  const results: MarketplaceExportReadiness[] = [];
  for (const id of productIds) {
    const product = await getAdminProduct(id);
    if (!product) {
      results.push({ productId: id, ready: false, missing: ["produto não encontrado"] });
      continue;
    }
    const map = await getCategoryMapForProduct(channel, product.categoryId);
    results.push(checkExportReadiness(product, channel, Boolean(map)));
  }
  return results;
}
