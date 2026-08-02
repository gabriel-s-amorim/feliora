import { createHash } from "node:crypto";
import { productDescriptionText } from "@/lib/productDescription";
import { absoluteUrl } from "@/lib/seo/metadata";
import { SITE_NAME } from "@/shared/const/site";
import type { Product, ProductVariant } from "@/shared/types/product";

/** Categoria Google: Apparel & Accessories > Clothing */
const GOOGLE_PRODUCT_CATEGORY = "1604";

/** Limite oficial do atributo id no Merchant Center. */
const MERCHANT_ID_MAX = 50;

const FEED_HEADERS = [
  "id",
  "title",
  "description",
  "link",
  "image_link",
  "additional_image_link",
  "availability",
  "price",
  "sale_price",
  "condition",
  "brand",
  "identifier_exists",
  "google_product_category",
  "product_type",
  "item_group_id",
  "color",
  "size",
  "gender",
  "age_group",
  "material",
  "shipping",
  "shipping_weight",
] as const;

type FeedHeader = (typeof FEED_HEADERS)[number];
type FeedRow = Record<FeedHeader, string>;

export type GoogleMerchantFeedOptions = {
  freeShippingEnabled: boolean;
  freeShippingThreshold: number;
  /** Frete estimado (BRL) quando a compra não atinge frete grátis. */
  defaultShippingPrice: number;
};

function escapeTsv(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/\n+/g, " ")
    .trim();
}

function formatMoney(amount: number): string {
  return `${amount.toFixed(2)} BRL`;
}

function absoluteImage(src: string | null | undefined): string {
  if (!src?.trim()) return "";
  const trimmed = src.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return absoluteUrl(trimmed.startsWith("/") ? trimmed : `/${trimmed}`);
}

function productDescription(product: Product): string {
  const raw =
    product.seoDescription ||
    product.shortDescription ||
    productDescriptionText(product.description) ||
    `${product.name} na ${SITE_NAME}`;
  return escapeTsv(raw).slice(0, 5000);
}

function colorImage(product: Product, colorName: string): string | undefined {
  const meta = product.colors.find(
    (c) => c.name.toLowerCase() === colorName.toLowerCase()
  );
  return meta?.imageUrl;
}

function shippingValue(
  price: number,
  options: GoogleMerchantFeedOptions
): string {
  if (
    options.freeShippingEnabled &&
    price >= options.freeShippingThreshold
  ) {
    return "BR:::0.00 BRL";
  }
  return `BR:::${options.defaultShippingPrice.toFixed(2)} BRL`;
}

function buildVariantTitle(
  product: Product,
  color: string,
  size: string
): string {
  const parts = [product.name];
  if (color) parts.push(color);
  if (size) parts.push(size);
  // Google recomenda ~150 chars; título com variante ajuda moda.
  return escapeTsv(parts.join(" - ")).slice(0, 150);
}

function additionalImages(product: Product, primary: string): string {
  const urls = [product.image, ...product.images]
    .map(absoluteImage)
    .filter((url) => url && url !== primary);
  return [...new Set(urls)].slice(0, 10).join(",");
}

/** ASCII seguro para id; Merchant recomenda alfanumérico, _ e -. */
function sanitizeMerchantId(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * id ≤ 50 chars e estável: SKU curto como está; SKU longo vira
 * `p{productId}-{hash}` (determinístico a partir do SKU/variant).
 */
export function merchantOfferId(
  product: Product,
  variant: ProductVariant | null
): string {
  const raw =
    variant?.sku?.trim() ||
    (variant ? `${product.id}-${variant.id}` : String(product.id));
  const cleaned = sanitizeMerchantId(escapeTsv(raw));

  if (cleaned.length > 0 && cleaned.length <= MERCHANT_ID_MAX) {
    return cleaned;
  }

  const basis =
    variant?.sku?.trim() || variant?.id || `product-${product.id}`;
  const hash = createHash("sha256").update(basis).digest("hex").slice(0, 10);
  return `p${product.id}-${hash}`.slice(0, MERCHANT_ID_MAX);
}

function rowForVariant(
  product: Product,
  variant: ProductVariant | null,
  options: GoogleMerchantFeedOptions
): FeedRow | null {
  const primary = absoluteImage(
    (variant && colorImage(product, variant.colorName)) || product.image
  );
  if (!primary) return null;

  const color = variant?.colorName || product.colors[0]?.name || "Única";
  const size = variant?.sizeLabel || product.sizes[0]?.label || "U";
  const inStock = variant
    ? variant.isActive && variant.stockCount > 0
    : product.inStock && product.stockCount > 0;

  const id = merchantOfferId(product, variant);

  const listPrice = product.originalPrice && product.originalPrice > product.price
    ? product.originalPrice
    : product.price;
  const salePrice =
    product.originalPrice && product.originalPrice > product.price
      ? product.price
      : null;

  return {
    id,
    title: buildVariantTitle(product, color, size),
    description: productDescription(product),
    link: absoluteUrl(`/produto/${product.slug}`),
    image_link: primary,
    additional_image_link: additionalImages(product, primary),
    availability: inStock ? "in_stock" : "out_of_stock",
    price: formatMoney(listPrice),
    sale_price: salePrice != null ? formatMoney(salePrice) : "",
    condition: "new",
    brand: SITE_NAME,
    identifier_exists: "no",
    google_product_category: GOOGLE_PRODUCT_CATEGORY,
    product_type: escapeTsv(
      product.category?.name
        ? `Moda feminina > ${product.category.name}`
        : "Moda feminina"
    ),
    item_group_id: String(product.id),
    color: escapeTsv(color).slice(0, 100),
    size: escapeTsv(size).slice(0, 100),
    gender: "female",
    age_group: "adult",
    material: escapeTsv(product.materials.filter(Boolean).join(" / ")).slice(
      0,
      200
    ),
    shipping: shippingValue(product.price, options),
    shipping_weight:
      product.weightKg != null && product.weightKg > 0
        ? `${product.weightKg.toFixed(3)} kg`
        : "",
  };
}

/** Uma linha por variante ativa; produto sem variantes gera uma linha. */
export function buildGoogleMerchantRows(
  products: Product[],
  options: GoogleMerchantFeedOptions
): FeedRow[] {
  const rows: FeedRow[] = [];
  const seenIds = new Set<string>();

  for (const product of products) {
    if (!product.isActive) continue;

    const activeVariants = (product.variants ?? []).filter((v) => v.isActive);
    const sources: Array<ProductVariant | null> =
      activeVariants.length > 0 ? activeVariants : [null];

    for (const variant of sources) {
      const row = rowForVariant(product, variant, options);
      if (!row) continue;
      if (seenIds.has(row.id)) continue;
      seenIds.add(row.id);
      rows.push(row);
    }
  }

  return rows;
}

export function serializeGoogleMerchantTsv(rows: FeedRow[]): string {
  const header = FEED_HEADERS.join("\t");
  const body = rows.map((row) =>
    FEED_HEADERS.map((key) => escapeTsv(row[key] ?? "")).join("\t")
  );
  return `${header}\n${body.join("\n")}\n`;
}

export function buildGoogleMerchantTsv(
  products: Product[],
  options: GoogleMerchantFeedOptions
): string {
  return serializeGoogleMerchantTsv(
    buildGoogleMerchantRows(products, options)
  );
}
