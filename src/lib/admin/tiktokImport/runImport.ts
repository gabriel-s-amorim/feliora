import {
  adminProductSlugExists,
  createAdminProduct,
  deleteAdminProduct,
  getAdminProduct,
  updateAdminProduct,
} from "@/lib/admin/products";
import { deleteStorageImages } from "@/lib/admin/uploads";
import { mapPool } from "@/lib/admin/tiktokImport/concurrency";
import { resolveProductImages } from "@/lib/admin/tiktokImport/images";
import {
  rebuildVariantsWithDimension,
} from "@/lib/admin/tiktokImport/mapProduct";
import type {
  SingleVariationAs,
  TikTokImportSelection,
  TikTokParsedProduct,
  TikTokRemotePayload,
} from "@/lib/admin/tiktokImport/types";
import {
  upsertCategoryMap,
  upsertProductLink,
  upsertVariantLink,
} from "@/lib/marketplace/links";
import { createAdminClient } from "@/lib/supabase/admin";
import { skuFor } from "@/shared/lib/sku";
import { slugify } from "@/shared/lib/slugify";
import type { ProductCreateInput } from "@/shared/schemas/product";

const DEFAULT_HEX = "#B76E79";

function buildSlugBase(name: string): string {
  return slugify(name) || "produto";
}

/** Sufixo do product_id TikTok só quando o slug base já existe. */
async function resolveUniqueSlug(
  name: string,
  tiktokProductId: string,
  excludeId?: number
): Promise<string> {
  const base = buildSlugBase(name);
  if (!(await adminProductSlugExists(base, excludeId))) {
    return base;
  }
  const suffix = tiktokProductId.replace(/\D/g, "").slice(-6) || "tt";
  const withSuffix = `${base}-${suffix}`.slice(0, 160);
  if (!(await adminProductSlugExists(withSuffix, excludeId))) {
    return withSuffix;
  }
  let i = 2;
  while (i < 50) {
    const candidate = `${withSuffix}-${i}`.slice(0, 160);
    if (!(await adminProductSlugExists(candidate, excludeId))) {
      return candidate;
    }
    i += 1;
  }
  return `${withSuffix}-${Date.now()}`.slice(0, 160);
}

function toProductInput(
  product: TikTokParsedProduct,
  opts: {
    slug: string;
    categoryId: string | null;
    singleVariationAs: SingleVariationAs;
    image: string;
    images: string[];
  }
): ProductCreateInput {
  const variantsRaw = rebuildVariantsWithDimension(
    product,
    opts.singleVariationAs
  );

  const sizes = [
    ...new Set(variantsRaw.map((v) => v.sizeLabel).filter(Boolean)),
  ].map((label) => ({ label }));

  const colorNames = [
    ...new Set(variantsRaw.map((v) => v.colorName).filter(Boolean)),
  ];
  const colors = colorNames.map((name) => ({ name, hex: DEFAULT_HEX }));

  const variants = variantsRaw.map((v) => ({
    sizeLabel: v.sizeLabel,
    colorName: v.colorName,
    // seller_sku do TikTok não é confiavelmente único (há exports que usam
    // "1" em todas as variantes). O SKU interno segue sempre o padrão Feliora.
    sku: skuFor(opts.slug, v.sizeLabel, v.colorName),
    stockCount: v.quantity,
    isActive: true,
  }));

  return {
    name: product.name.slice(0, 160),
    slug: opts.slug,
    categoryId: opts.categoryId,
    price: product.price,
    originalPrice: null,
    image: opts.image,
    images: opts.images,
    badge: "",
    badgeColor: DEFAULT_HEX,
    featured: false,
    isNew: false,
    shortDescription: "",
    description: product.description,
    materials: [],
    careInstructions: [],
    sizes,
    colors,
    widthCm: product.widthCm,
    heightCm: product.heightCm,
    lengthCm: product.lengthCm,
    weightKg: product.weightKg,
    faq: [],
    highlights: [],
    isActive: true,
    variants,
  };
}

function readRemotePayload(raw: unknown): TikTokRemotePayload | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (obj.source !== "xlsx") return null;
  const imageMap =
    obj.imageMap && typeof obj.imageMap === "object"
      ? (obj.imageMap as Record<string, string>)
      : {};
  const sourceImageUrls = Array.isArray(obj.sourceImageUrls)
    ? obj.sourceImageUrls.filter((u): u is string => typeof u === "string")
    : [];
  return { source: "xlsx", sourceImageUrls, imageMap };
}

async function getLinkByExternal(externalItemId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("marketplace_product_links")
    .select("*")
    .eq("channel", "tiktok")
    .eq("external_item_id", externalItemId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as {
    id: string;
    product_id: number;
    remote_payload: unknown;
  } | null;
}

async function maybeUpsertCategoryMap(
  product: TikTokParsedProduct,
  categoryId: string | null
): Promise<void> {
  if (!categoryId || !product.categoryCode) return;
  await upsertCategoryMap({
    channel: "tiktok",
    felioraCategoryId: categoryId,
    externalCategoryId: product.categoryCode,
    externalCategoryName: product.categoryName ?? "",
  });
}

async function linkVariants(
  productLinkId: string,
  felioraProductId: number,
  product: TikTokParsedProduct,
  singleVariationAs: SingleVariationAs
): Promise<void> {
  const created = await getAdminProduct(felioraProductId);
  const desired = rebuildVariantsWithDimension(product, singleVariationAs);
  for (const variant of created?.variants ?? []) {
    const match = desired.find(
      (d) =>
        d.sizeLabel.trim().toLowerCase() ===
          variant.sizeLabel.trim().toLowerCase() &&
        d.colorName.trim().toLowerCase() ===
          variant.colorName.trim().toLowerCase()
    );
    await upsertVariantLink({
      channel: "tiktok",
      variantId: variant.id,
      productLinkId,
      externalSkuId: match?.skuId ?? "",
      externalSku: match?.sellerSku.trim() || variant.sku,
    });
  }
}

export type ImportProductResult = {
  tiktokProductId: string;
  ok: boolean;
  message?: string;
  warnings?: string[];
  convertedCount?: number;
};

async function importOneProduct(
  product: TikTokParsedProduct,
  selection: TikTokImportSelection
): Promise<ImportProductResult> {
  if (selection.action === "skip") {
    return { tiktokProductId: product.tiktokProductId, ok: true, message: "Pulado" };
  }

  await maybeUpsertCategoryMap(product, selection.categoryId);

  const existingLink = await getLinkByExternal(product.tiktokProductId);
  const targetId =
    selection.action === "update"
      ? (product.duplicate.felioraProductId ??
          existingLink?.product_id ??
          null)
      : null;

  if (selection.action === "update" && !targetId) {
    throw new Error("Produto duplicado não encontrado para atualizar");
  }

  const existingProduct = targetId ? await getAdminProduct(targetId) : null;
  const previousPayload = readRemotePayload(existingLink?.remote_payload);
  const previousMap = previousPayload?.imageMap ?? {};

  if (!product.mainImageUrl) {
    throw new Error("Produto sem imagem principal");
  }

  const resolved = await resolveProductImages({
    sourceUrls: product.imageUrls,
    existingMap: selection.action === "update" ? previousMap : {},
  });

  const image = resolved.felioraUrls[0] ?? "";
  const images = resolved.felioraUrls.slice(1);

  const slug =
    selection.action === "update" && existingProduct
      ? existingProduct.slug
      : await resolveUniqueSlug(
          product.name,
          product.tiktokProductId,
          targetId ?? undefined
        );

  const input = toProductInput(product, {
    slug,
    categoryId: selection.categoryId,
    singleVariationAs: selection.singleVariationAs,
    image,
    images,
  });

  let felioraProductId: number | null = null;
  let createdNewProduct = false;

  try {
    if (selection.action === "update" && targetId) {
      const oldUrls = [
        existingProduct?.image,
        ...(existingProduct?.images ?? []),
      ].filter(Boolean) as string[];

      await updateAdminProduct(targetId, input);
      felioraProductId = targetId;

      const newUrls = new Set([image, ...images]);
      const orphans = oldUrls.filter((u) => !newUrls.has(u));
      if (orphans.length > 0) {
        await deleteStorageImages(orphans);
      }
    } else {
      const created = await createAdminProduct(input);
      felioraProductId = created.id;
      createdNewProduct = true;
    }

    const remotePayload: TikTokRemotePayload = {
      source: "xlsx",
      sourceImageUrls: product.imageUrls,
      imageMap: resolved.imageMap,
    };

    const link = await upsertProductLink({
      channel: "tiktok",
      productId: felioraProductId,
      externalItemId: product.tiktokProductId,
      status: "listed",
      remotePayload,
    });

    await linkVariants(
      link.id,
      felioraProductId,
      product,
      selection.singleVariationAs
    );
  } catch (error) {
    if (createdNewProduct && felioraProductId !== null) {
      await deleteAdminProduct(felioraProductId).catch((rollbackError) => {
        console.error(
          "[tiktok-import] falha no rollback",
          felioraProductId,
          rollbackError
        );
      });
    }

    // Em criação, todas as imagens foram geradas para este produto. Remove-as
    // quando o banco/link falhar para não acumular arquivos órfãos.
    if (selection.action === "create") {
      await deleteStorageImages(resolved.felioraUrls);
    }
    throw error;
  }

  return {
    tiktokProductId: product.tiktokProductId,
    ok: true,
    warnings: resolved.warnings,
    convertedCount: resolved.convertedCount,
  };
}

export async function runTikTokXlsxImport(input: {
  products: TikTokParsedProduct[];
  selections: TikTokImportSelection[];
  report: (
    done: number,
    error?: { message: string; externalId?: string }
  ) => Promise<void>;
}): Promise<void> {
  const byId = new Map(input.products.map((p) => [p.tiktokProductId, p]));
  const tasks = input.selections.filter((s) => s.action !== "skip");

  let done = 0;
  await mapPool(tasks, 2, async (selection) => {
    const product = byId.get(selection.tiktokProductId);
    try {
      if (!product) {
        throw new Error("Produto não encontrado no payload parseado");
      }
      const result = await importOneProduct(product, selection);
      if (result.warnings?.length) {
        console.warn(
          "[tiktok-import]",
          selection.tiktokProductId,
          result.warnings.join("; ")
        );
      }
      done += 1;
      await input.report(done);
    } catch (err) {
      done += 1;
      await input.report(done, {
        message: err instanceof Error ? err.message : "Erro na importação",
        externalId: selection.tiktokProductId,
      });
    }
  });
}
