import { createAdminProduct, getAdminProduct } from "@/lib/admin/products";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getCategoryMapForProduct,
  getProductLink,
  upsertProductLink,
  upsertVariantLink,
} from "@/lib/marketplace/links";
import {
  shopeeAddItem,
  shopeeGetChannelList,
  shopeeGetItemBaseInfo,
  shopeeGetItemList,
  shopeeGetModelList,
  shopeeInitTierVariation,
  shopeeUploadImage,
} from "@/lib/marketplace/shopee/client";
import {
  getChannelSettings,
  getResolvedCredentials,
  touchChannelSync,
} from "@/lib/marketplace/settings";
import {
  tiktokCreateProduct,
  tiktokGetProduct,
  tiktokSearchProducts,
} from "@/lib/marketplace/tiktok/client";
import type {
  MarketplaceChannel,
  MarketplaceRemoteProduct,
} from "@/shared/types/marketplace";

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function listRemoteProducts(
  channel: MarketplaceChannel,
  page = 0
): Promise<{
  products: MarketplaceRemoteProduct[];
  hasMore: boolean;
  nextPageToken?: string;
}> {
  const supabase = createAdminClient();
  const { data: links } = await supabase
    .from("marketplace_product_links")
    .select("product_id, external_item_id")
    .eq("channel", channel)
    .neq("external_item_id", "");

  const linkedByExternal = new Map(
    ((links ?? []) as Array<{ product_id: number; external_item_id: string }>).map(
      (l) => [l.external_item_id, l.product_id]
    )
  );

  if (channel === "shopee") {
    const offset = page * 50;
    const list = await shopeeGetItemList(offset, 50);
    const ids = (list.item ?? []).map((i) => i.item_id);
    if (ids.length === 0) {
      return { products: [], hasMore: false };
    }
    const info = await shopeeGetItemBaseInfo(ids);
    const products: MarketplaceRemoteProduct[] = (info.item_list ?? []).map(
      (item) => {
        const externalId = String(item.item_id);
        const linkedProductId = linkedByExternal.get(externalId) ?? null;
        return {
          externalItemId: externalId,
          name: item.item_name,
          price: item.price_info?.[0]?.current_price ?? null,
          stock:
            item.stock_info_v2?.summary_info?.total_available_stock ?? null,
          imageUrl: item.image?.image_url_list?.[0] ?? null,
          status: "NORMAL",
          sku: item.item_sku ?? null,
          alreadyLinked: linkedProductId !== null,
          linkedProductId,
        };
      }
    );
    return {
      products,
      hasMore: Boolean(list.has_next_page),
    };
  }

  const pageToken = page > 0 ? String(page) : "";
  const data = await tiktokSearchProducts(pageToken, 20);
  const products: MarketplaceRemoteProduct[] = [];
  for (const item of data.products ?? []) {
    const detail = await tiktokGetProduct(item.id).catch(() => null);
    const sku = detail?.skus?.[0];
    const linkedProductId = linkedByExternal.get(item.id) ?? null;
    products.push({
      externalItemId: item.id,
      name: item.title,
      price: sku?.price?.sale_price ? Number(sku.price.sale_price) : null,
      stock: sku?.inventory?.[0]?.quantity ?? null,
      imageUrl: item.main_images?.[0]?.urls?.[0] ?? null,
      status: item.status,
      sku: sku?.seller_sku ?? null,
      alreadyLinked: linkedProductId !== null,
      linkedProductId,
    });
  }
  return {
    products,
    hasMore: Boolean(data.next_page_token),
    nextPageToken: data.next_page_token,
  };
}

export async function importRemoteProducts(
  channel: MarketplaceChannel,
  externalItemIds: string[],
  categoryId?: string | null
): Promise<{ imported: number; errors: Array<{ externalId: string; message: string }> }> {
  const errors: Array<{ externalId: string; message: string }> = [];
  let imported = 0;

  for (const externalId of externalItemIds) {
    try {
      const existing = await createAdminClient()
        .from("marketplace_product_links")
        .select("product_id")
        .eq("channel", channel)
        .eq("external_item_id", externalId)
        .maybeSingle();
      if (existing.data) {
        errors.push({
          externalId,
          message: "Já vinculado a um produto Feliora",
        });
        continue;
      }

      if (channel === "shopee") {
        await importShopeeItem(Number(externalId), categoryId ?? null);
      } else {
        await importTikTokItem(externalId, categoryId ?? null);
      }
      imported += 1;
    } catch (err) {
      errors.push({
        externalId,
        message: err instanceof Error ? err.message : "Falha no import",
      });
    }
  }

  await touchChannelSync(channel);
  return { imported, errors };
}

async function importShopeeItem(
  itemId: number,
  categoryId: string | null
): Promise<void> {
  const info = await shopeeGetItemBaseInfo([itemId]);
  const item = info.item_list?.[0];
  if (!item) throw new Error("Item Shopee não encontrado");

  const models = await shopeeGetModelList(itemId).catch(() => null);
  const images = item.image?.image_url_list ?? [];
  const price = item.price_info?.[0]?.current_price ?? 0;
  const baseSlug = `${slugify(item.item_name)}-${itemId}`;

  const variants =
    models?.model && models.model.length > 0
      ? models.model.map((m, idx) => {
          const tier = models.tier_variation ?? [];
          const sizeLabel =
            tier[0]?.option_list?.[m.tier_index?.[0] ?? 0]?.option ?? "U";
          const colorName =
            tier[1]?.option_list?.[m.tier_index?.[1] ?? 0]?.option ?? "Única";
          return {
            sizeLabel,
            colorName,
            sku: m.model_sku || `${item.item_sku || itemId}-${idx + 1}`,
            stockCount:
              m.stock_info_v2?.summary_info?.total_available_stock ?? 0,
            isActive: true,
          };
        })
      : [
          {
            sizeLabel: "U",
            colorName: "Única",
            sku: item.item_sku || `SHOPEE-${itemId}`,
            stockCount:
              item.stock_info_v2?.summary_info?.total_available_stock ?? 0,
            isActive: true,
          },
        ];

  const product = await createAdminProduct({
    slug: baseSlug,
    name: item.item_name,
    categoryId,
    price,
    originalPrice: item.price_info?.[0]?.original_price ?? null,
    image: images[0] ?? "",
    images,
    badge: "",
    badgeColor: "",
    featured: false,
    isNew: false,
    shortDescription: "",
    seoTitle: "",
    seoDescription: "",
    description: item.description ?? "",
    materials: [],
    careInstructions: [],
    sizes: [...new Set(variants.map((v) => v.sizeLabel))].map((label) => ({
      label,
    })),
    colors: [...new Set(variants.map((v) => v.colorName))].map((name) => ({
      name,
      hex: "#B76E79",
    })),
    widthCm: item.dimension?.package_width ?? null,
    heightCm: item.dimension?.package_height ?? null,
    lengthCm: item.dimension?.package_length ?? null,
    weightKg: item.weight ? Number(item.weight) : null,
    faq: [],
    highlights: [],
    isActive: true,
    variants,
  });

  const link = await upsertProductLink({
    channel: "shopee",
    productId: product.id,
    externalItemId: String(itemId),
    status: "listed",
    remotePayload: item,
  });

  const created = await getAdminProduct(product.id);
  for (const variant of created?.variants ?? []) {
    const model = models?.model?.find(
      (m) => (m.model_sku || "") === variant.sku
    );
    await upsertVariantLink({
      channel: "shopee",
      variantId: variant.id,
      productLinkId: link.id,
      externalModelId: model ? String(model.model_id) : "",
      externalSku: variant.sku,
    });
  }
}

async function importTikTokItem(
  productId: string,
  categoryId: string | null
): Promise<void> {
  const item = await tiktokGetProduct(productId);
  const images =
    item.main_images?.flatMap((img) => img.urls ?? []).filter(Boolean) ?? [];
  const skus = item.skus ?? [];
  const price = skus[0]?.price?.sale_price
    ? Number(skus[0].price.sale_price)
    : 0;

  const variants =
    skus.length > 0
      ? skus.map((sku, idx) => {
          const sizeAttr = sku.sales_attributes?.find((a) =>
            /size|tamanho/i.test(a.name)
          );
          const colorAttr = sku.sales_attributes?.find((a) =>
            /color|cor/i.test(a.name)
          );
          return {
            sizeLabel: sizeAttr?.value_name || "U",
            colorName: colorAttr?.value_name || "Única",
            sku: sku.seller_sku || `TT-${productId}-${idx + 1}`,
            stockCount: sku.inventory?.[0]?.quantity ?? 0,
            isActive: true,
          };
        })
      : [
          {
            sizeLabel: "U",
            colorName: "Única",
            sku: `TT-${productId}`,
            stockCount: 0,
            isActive: true,
          },
        ];

  const weight = item.package_weight?.value
    ? Number(item.package_weight.value)
    : null;

  const product = await createAdminProduct({
    slug: `${slugify(item.title)}-${productId.slice(-6)}`,
    name: item.title,
    categoryId,
    price,
    originalPrice: null,
    image: images[0] ?? "",
    images,
    badge: "",
    badgeColor: "",
    featured: false,
    isNew: false,
    shortDescription: "",
    seoTitle: "",
    seoDescription: "",
    description: item.description ?? "",
    materials: [],
    careInstructions: [],
    sizes: [...new Set(variants.map((v) => v.sizeLabel))].map((label) => ({
      label,
    })),
    colors: [...new Set(variants.map((v) => v.colorName))].map((name) => ({
      name,
      hex: "#B76E79",
    })),
    widthCm: item.package_dimensions?.width
      ? Number(item.package_dimensions.width)
      : null,
    heightCm: item.package_dimensions?.height
      ? Number(item.package_dimensions.height)
      : null,
    lengthCm: item.package_dimensions?.length
      ? Number(item.package_dimensions.length)
      : null,
    weightKg: weight,
    faq: [],
    highlights: [],
    isActive: true,
    variants,
  });

  const link = await upsertProductLink({
    channel: "tiktok",
    productId: product.id,
    externalItemId: productId,
    status: "listed",
    remotePayload: item,
  });

  const created = await getAdminProduct(product.id);
  for (const variant of created?.variants ?? []) {
    const sku = skus.find((s) => (s.seller_sku || "") === variant.sku);
    await upsertVariantLink({
      channel: "tiktok",
      variantId: variant.id,
      productLinkId: link.id,
      externalSkuId: sku?.id ?? "",
      externalSku: variant.sku,
    });
  }
}

export async function exportProductToChannel(
  channel: MarketplaceChannel,
  productId: number
): Promise<void> {
  const product = await getAdminProduct(productId);
  if (!product) throw new Error("Produto não encontrado");

  const categoryMap = await getCategoryMapForProduct(
    channel,
    product.categoryId
  );
  if (!categoryMap) {
    throw new Error(`Mapeie a categoria Feliora para ${channel} em Canais`);
  }

  const existing = await getProductLink(channel, productId);
  if (existing?.external_item_id && existing.status === "listed") {
    // Já listado — apenas marca sync (update completo fica para sync price/stock)
    await upsertProductLink({
      channel,
      productId,
      externalItemId: existing.external_item_id,
      status: "listed",
    });
    return;
  }

  const images = [
    product.image,
    ...(product.images ?? []),
  ].filter(Boolean);
  if (images.length === 0) throw new Error("Produto sem imagens");

  const variants = (product.variants ?? []).filter((v) => v.isActive);
  if (variants.length === 0) throw new Error("Sem variantes ativas");

  if (channel === "shopee") {
    const imageIds: string[] = [];
    for (const url of images.slice(0, 9)) {
      imageIds.push(await shopeeUploadImage(url));
    }

    const channels = await shopeeGetChannelList();
    const logisticInfo = (channels.logistics_channel_list ?? [])
      .filter((c) => c.enabled)
      .slice(0, 5)
      .map((c) => ({
        logistic_id: c.logistics_channel_id,
        enabled: true,
      }));

    if (logisticInfo.length === 0) {
      throw new Error(
        "Nenhum canal logístico habilitado na Shopee. Ative frete no Seller Center."
      );
    }

    const added = await shopeeAddItem({
      item_name: product.name.slice(0, 120),
      description: (product.description || product.shortDescription || product.name).slice(
        0,
        5000
      ),
      category_id: Number(categoryMap.externalCategoryId),
      image: { image_id_list: imageIds },
      original_price: product.price,
      normal_stock: variants.reduce((s, v) => s + v.stockCount, 0),
      weight: String(product.weightKg ?? 0.3),
      dimension: {
        package_length: Math.round(product.lengthCm ?? 20),
        package_width: Math.round(product.widthCm ?? 15),
        package_height: Math.round(product.heightCm ?? 5),
      },
      logistic_info: logisticInfo,
      brand: { brand_id: 0 },
      item_status: "NORMAL",
      attribute_list: Object.entries(categoryMap.attributesJson).map(
        ([attribute_id, value]) => ({
          attribute_id: Number(attribute_id),
          attribute_value_list: [
            typeof value === "object" && value !== null
              ? (value as Record<string, unknown>)
              : { value_id: 0, original_value_name: String(value) },
          ],
        })
      ),
    });

    const itemId = added.item_id;
    const sizes = [...new Set(variants.map((v) => v.sizeLabel))];
    const colors = [...new Set(variants.map((v) => v.colorName))];
    const tierVariation =
      colors.length > 1 || sizes.length > 1
        ? [
            ...(sizes.length
              ? [
                  {
                    name: "Tamanho",
                    option_list: sizes.map((option) => ({ option })),
                  },
                ]
              : []),
            ...(colors.length > 1
              ? [
                  {
                    name: "Cor",
                    option_list: colors.map((option) => ({ option })),
                  },
                ]
              : []),
          ]
        : [];

    if (tierVariation.length > 0) {
      const model = variants.map((v) => ({
        tier_index: [
          sizes.indexOf(v.sizeLabel),
          ...(tierVariation.length > 1 ? [colors.indexOf(v.colorName)] : []),
        ].filter((i) => i >= 0),
        normal_stock: v.stockCount,
        original_price: product.price,
        model_sku: v.sku,
      }));
      await shopeeInitTierVariation(itemId, tierVariation, model);
      const models = await shopeeGetModelList(itemId);
      const link = await upsertProductLink({
        channel: "shopee",
        productId,
        externalItemId: String(itemId),
        status: "listed",
      });
      for (const variant of variants) {
        const m = models.model?.find((x) => x.model_sku === variant.sku);
        await upsertVariantLink({
          channel: "shopee",
          variantId: variant.id,
          productLinkId: link.id,
          externalModelId: m ? String(m.model_id) : "",
          externalSku: variant.sku,
        });
      }
    } else {
      const link = await upsertProductLink({
        channel: "shopee",
        productId,
        externalItemId: String(itemId),
        status: "listed",
      });
      await upsertVariantLink({
        channel: "shopee",
        variantId: variants[0].id,
        productLinkId: link.id,
        externalSku: variants[0].sku,
      });
    }
  } else {
    const row = await getChannelSettings("tiktok");
    const warehouseId = getResolvedCredentials(row).warehouseId;
    if (!warehouseId) {
      throw new Error("Configure o Warehouse ID do TikTok em Integrações");
    }

    const created = await tiktokCreateProduct({
      title: product.name.slice(0, 255),
      description: product.description || product.shortDescription || product.name,
      category_id: categoryMap.externalCategoryId,
      main_images: images.slice(0, 9).map((url) => ({ urls: [url] })),
      package_weight: {
        value: String(product.weightKg ?? 0.3),
        unit: "KILOGRAM",
      },
      package_dimensions: {
        length: String(product.lengthCm ?? 20),
        width: String(product.widthCm ?? 15),
        height: String(product.heightCm ?? 5),
        unit: "CENTIMETER",
      },
      skus: variants.map((v) => ({
        seller_sku: v.sku,
        price: {
          amount: product.price.toFixed(2),
          currency: "BRL",
        },
        inventory: [{ warehouse_id: warehouseId, quantity: v.stockCount }],
        sales_attributes: [
          { name: "Tamanho", value_name: v.sizeLabel },
          { name: "Cor", value_name: v.colorName },
        ],
      })),
    });

    const externalId = String(created.product_id ?? created.id ?? "");
    if (!externalId) throw new Error("TikTok não retornou product_id");

    // Re-fetch to get sku ids
    const detail = await tiktokGetProduct(externalId).catch(() => null);
    const link = await upsertProductLink({
      channel: "tiktok",
      productId,
      externalItemId: externalId,
      status: "listed",
      remotePayload: detail,
    });

    for (const variant of variants) {
      const sku = detail?.skus?.find((s) => s.seller_sku === variant.sku);
      await upsertVariantLink({
        channel: "tiktok",
        variantId: variant.id,
        productLinkId: link.id,
        externalSkuId: sku?.id ?? "",
        externalSku: variant.sku,
      });
    }
  }

  await touchChannelSync(channel);
}
