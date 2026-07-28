import { z } from "zod";

/** Payload da RPC decrement_variant_stock / check_variants_availability */
export const stockItemRpcSchema = z.object({
  variant_id: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const stockItemsRpcSchema = z.array(stockItemRpcSchema).min(1);

export type StockItemRpc = z.infer<typeof stockItemRpcSchema>;

export function toStockRpcPayload(
  items: { variantId: string; quantity: number }[]
): StockItemRpc[] {
  return items.map((item) => ({
    variant_id: item.variantId,
    quantity: item.quantity,
  }));
}
