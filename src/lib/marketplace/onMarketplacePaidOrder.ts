import { createAdminClient } from "@/lib/supabase/admin";
import {
  findVariantByExternalSku,
  findVariantByExternalSkuId,
} from "@/lib/marketplace/links";
import { pushStockToLinkedChannels } from "@/lib/marketplace/syncStock";
import type { MarketplaceChannel } from "@/shared/types/marketplace";

export type MarketplaceOrderLine = {
  externalSku?: string;
  externalSkuId?: string;
  externalModelId?: string;
  quantity: number;
  variantId?: string;
};

/**
 * Baixa estoque Feliora quando pedido marketplace é pago (idempotente).
 * Em seguida empurra saldo aos outros canais.
 */
export async function onMarketplacePaidOrder(input: {
  channel: MarketplaceChannel;
  externalOrderId: string;
  status: string;
  lines: MarketplaceOrderLine[];
  rawPayload?: unknown;
}): Promise<{ decremented: boolean; productIds: number[] }> {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("marketplace_orders")
    .select("*")
    .eq("channel", input.channel)
    .eq("external_order_id", input.externalOrderId)
    .maybeSingle();

  if (existing?.stock_decremented_at) {
    return { decremented: false, productIds: [] };
  }

  const resolved: Array<{ variant_id: string; quantity: number }> = [];
  const productIds = new Set<number>();

  for (const line of input.lines) {
    if (line.quantity <= 0) continue;

    let variantId = line.variantId;
    if (!variantId && line.externalSkuId) {
      const link = await findVariantByExternalSkuId(
        input.channel,
        line.externalSkuId
      );
      variantId = link?.variant_id;
    }
    if (!variantId && line.externalSku) {
      const link = await findVariantByExternalSku(
        input.channel,
        line.externalSku
      );
      variantId = link?.variant_id;
    }

    // Fallback: match by product_variants.sku directly
    if (!variantId && line.externalSku) {
      const { data: variant } = await supabase
        .from("product_variants")
        .select("id, product_id")
        .eq("sku", line.externalSku)
        .eq("is_active", true)
        .maybeSingle();
      if (variant) {
        variantId = variant.id as string;
        productIds.add(variant.product_id as number);
      }
    }

    if (!variantId) {
      console.warn(
        `[marketplace] SKU não mapeado ${input.channel} order ${input.externalOrderId}`,
        line
      );
      continue;
    }

    if (!productIds.size || !line.variantId) {
      const { data: variant } = await supabase
        .from("product_variants")
        .select("product_id")
        .eq("id", variantId)
        .maybeSingle();
      if (variant) productIds.add(variant.product_id as number);
    }

    resolved.push({ variant_id: variantId, quantity: line.quantity });
  }

  const { error: upsertError } = await supabase.from("marketplace_orders").upsert(
    {
      channel: input.channel,
      external_order_id: input.externalOrderId,
      status: input.status,
      line_items: resolved,
      raw_payload: input.rawPayload ?? null,
    },
    { onConflict: "channel,external_order_id" }
  );
  if (upsertError) throw new Error(upsertError.message);

  if (resolved.length === 0) {
    return { decremented: false, productIds: [] };
  }

  const { error: stockError } = await supabase.rpc("decrement_variant_stock", {
    p_items: resolved,
  });

  if (stockError) {
    // Estoque insuficiente: ainda registra tentativa sem marcar decremented
    throw new Error(stockError.message);
  }

  await supabase
    .from("marketplace_orders")
    .update({ stock_decremented_at: new Date().toISOString() })
    .eq("channel", input.channel)
    .eq("external_order_id", input.externalOrderId);

  const ids = [...productIds];
  // Fire-and-forget push to other channels
  void pushStockToLinkedChannels(ids, input.channel);

  return { decremented: true, productIds: ids };
}

/** Após venda no site, sincroniza estoque com marketplaces vinculados. */
export async function afterSiteStockDecrement(
  orderId: string
): Promise<void> {
  const supabase = createAdminClient();
  const { data: items } = await supabase
    .from("order_items")
    .select("variant_id, product_id")
    .eq("order_id", orderId);

  const productIds = [
    ...new Set(
      ((items ?? []) as Array<{ product_id: number | null }>)
        .map((i) => i.product_id)
        .filter((id): id is number => typeof id === "number")
    ),
  ];

  if (productIds.length === 0) return;
  await pushStockToLinkedChannels(productIds);
}
