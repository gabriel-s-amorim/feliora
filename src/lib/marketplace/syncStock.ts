import { getAdminProduct } from "@/lib/admin/products";
import {
  getProductLink,
  listVariantLinksForProductLink,
} from "@/lib/marketplace/links";
import {
  shopeeUpdatePrice,
  shopeeUpdateStock,
} from "@/lib/marketplace/shopee/client";
import {
  getChannelSettings,
  getResolvedCredentials,
  touchChannelSync,
} from "@/lib/marketplace/settings";
import {
  tiktokUpdateInventory,
  tiktokUpdatePrice,
} from "@/lib/marketplace/tiktok/client";
import type { MarketplaceChannel } from "@/shared/types/marketplace";

export async function pushStockForProduct(
  channel: MarketplaceChannel,
  productId: number
): Promise<void> {
  const link = await getProductLink(channel, productId);
  if (!link?.external_item_id || link.status !== "listed") {
    throw new Error(`Produto ${productId} não está listado em ${channel}`);
  }

  const product = await getAdminProduct(productId);
  if (!product) throw new Error("Produto não encontrado");

  const variantLinks = await listVariantLinksForProductLink(link.id);
  const variants = (product.variants ?? []).filter((v) => v.isActive);

  if (channel === "shopee") {
    const stockList = variants.map((variant) => {
      const vl = variantLinks.find((l) => l.variant_id === variant.id);
      const entry: {
        model_id?: number;
        seller_stock: Array<{ stock: number }>;
      } = {
        seller_stock: [{ stock: Math.max(0, variant.stockCount) }],
      };
      if (vl?.external_model_id) {
        entry.model_id = Number(vl.external_model_id);
      }
      return entry;
    });

    await shopeeUpdateStock(Number(link.external_item_id), stockList);
  } else {
    const row = await getChannelSettings("tiktok");
    const warehouseId =
      getResolvedCredentials(row).warehouseId ||
      variantLinks[0]?.external_sku_id; // fallback unused
    if (!getResolvedCredentials(row).warehouseId) {
      throw new Error("Configure warehouse_id do TikTok em Integrações");
    }
    void warehouseId;

    const skus = variants
      .map((variant) => {
        const vl = variantLinks.find((l) => l.variant_id === variant.id);
        if (!vl?.external_sku_id) return null;
        return {
          id: vl.external_sku_id,
          inventory: [
            {
              warehouse_id: getResolvedCredentials(row).warehouseId,
              quantity: Math.max(0, variant.stockCount),
            },
          ],
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      inventory: Array<{ warehouse_id: string; quantity: number }>;
    }>;

    if (skus.length === 0) {
      throw new Error("Nenhum SKU TikTok vinculado para atualizar estoque");
    }
    await tiktokUpdateInventory(link.external_item_id, skus);
  }

  await touchChannelSync(channel);
}

export async function pushPriceForProduct(
  channel: MarketplaceChannel,
  productId: number
): Promise<void> {
  const link = await getProductLink(channel, productId);
  if (!link?.external_item_id || link.status !== "listed") {
    throw new Error(`Produto ${productId} não está listado em ${channel}`);
  }

  const product = await getAdminProduct(productId);
  if (!product) throw new Error("Produto não encontrado");

  const variantLinks = await listVariantLinksForProductLink(link.id);
  const variants = (product.variants ?? []).filter((v) => v.isActive);
  const price = product.price;

  if (channel === "shopee") {
    const priceList = variants.map((variant) => {
      const vl = variantLinks.find((l) => l.variant_id === variant.id);
      const entry: { model_id?: number; original_price: number } = {
        original_price: price,
      };
      if (vl?.external_model_id) {
        entry.model_id = Number(vl.external_model_id);
      }
      return entry;
    });
    await shopeeUpdatePrice(Number(link.external_item_id), priceList);
  } else {
    const skus = variants
      .map((variant) => {
        const vl = variantLinks.find((l) => l.variant_id === variant.id);
        if (!vl?.external_sku_id) return null;
        return {
          id: vl.external_sku_id,
          price: { amount: price.toFixed(2), currency: "BRL" },
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      price: { amount: string; currency: string };
    }>;
    if (skus.length === 0) {
      throw new Error("Nenhum SKU TikTok vinculado para atualizar preço");
    }
    await tiktokUpdatePrice(link.external_item_id, skus);
  }

  await touchChannelSync(channel);
}

/** Após baixa local (site ou marketplace), empurra estoque aos canais vinculados. */
export async function pushStockToLinkedChannels(
  productIds: number[],
  excludeChannel?: MarketplaceChannel
): Promise<void> {
  const channels: MarketplaceChannel[] = ["shopee", "tiktok"];
  for (const productId of productIds) {
    for (const channel of channels) {
      if (excludeChannel && channel === excludeChannel) continue;
      const link = await getProductLink(channel, productId);
      if (!link || link.status !== "listed" || !link.external_item_id) continue;
      try {
        await pushStockForProduct(channel, productId);
      } catch (err) {
        console.error(
          `[marketplace] falha push estoque ${channel} produto ${productId}:`,
          err
        );
      }
    }
  }
}
