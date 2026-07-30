import type {
  Product,
  ProductColorMeta,
  ProductSizeMeta,
  ProductVariant,
} from "@/shared/types/product";

export type ProductVariantRow = {
  id: string;
  product_id: number;
  size_label: string;
  color_name: string;
  sku: string;
  stock_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductRow = {
  id: number;
  slug: string;
  name: string;
  category_id: string | null;
  price: number | string;
  original_price: number | string | null;
  image: string;
  images: unknown;
  badge: string;
  badge_color: string;
  featured: boolean;
  is_new: boolean;
  short_description: string;
  seo_title?: string;
  seo_description?: string;
  description: string;
  materials: unknown;
  care_instructions: unknown;
  sizes: unknown;
  colors: unknown;
  in_stock: boolean;
  stock_count: number;
  width_cm: number | string | null;
  height_cm: number | string | null;
  length_cm: number | string | null;
  weight_kg: number | string | null;
  faq: unknown;
  highlights: unknown;
  rating_avg: number | string;
  reviews_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product_variants?: ProductVariantRow[];
  categories?: { id: string; slug: string; name: string } | null;
};

function asNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return typeof value === "number" ? value : Number(value);
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v) => typeof v === "string") : [];
}

function asSizes(value: unknown): ProductSizeMeta[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (item && typeof item === "object" && "label" in item) {
        return { label: String((item as { label: unknown }).label) };
      }
      return null;
    })
    .filter((v): v is ProductSizeMeta => Boolean(v));
}

function asColors(value: unknown): ProductColorMeta[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (item && typeof item === "object" && "name" in item && "hex" in item) {
        const row = item as { name: unknown; hex: unknown };
        return { name: String(row.name), hex: String(row.hex) };
      }
      return null;
    })
    .filter((v): v is ProductColorMeta => Boolean(v));
}

function asFaq(value: unknown): { question: string; answer: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (item && typeof item === "object" && "question" in item && "answer" in item) {
        const row = item as { question: unknown; answer: unknown };
        return { question: String(row.question), answer: String(row.answer) };
      }
      return null;
    })
    .filter((v): v is { question: string; answer: string } => Boolean(v));
}

export function mapProductVariant(row: ProductVariantRow): ProductVariant {
  return {
    id: row.id,
    productId: row.product_id,
    sizeLabel: row.size_label,
    colorName: row.color_name,
    sku: row.sku,
    stockCount: row.stock_count,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    categoryId: row.category_id,
    price: Number(row.price),
    originalPrice: asNumber(row.original_price),
    image: row.image,
    images: asStringArray(row.images),
    badge: row.badge,
    badgeColor: row.badge_color,
    featured: row.featured,
    isNew: row.is_new,
    shortDescription: row.short_description,
    seoTitle: row.seo_title ?? "",
    seoDescription: row.seo_description ?? "",
    description: row.description,
    materials: asStringArray(row.materials),
    careInstructions: asStringArray(row.care_instructions),
    sizes: asSizes(row.sizes),
    colors: asColors(row.colors),
    inStock: row.in_stock,
    stockCount: row.stock_count,
    widthCm: asNumber(row.width_cm),
    heightCm: asNumber(row.height_cm),
    lengthCm: asNumber(row.length_cm),
    weightKg: asNumber(row.weight_kg),
    faq: asFaq(row.faq),
    highlights: asStringArray(row.highlights),
    ratingAvg: Number(row.rating_avg),
    reviewsCount: row.reviews_count,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    variants: row.product_variants?.map(mapProductVariant),
    category: row.categories ?? null,
  };
}

/** Campos do produto (sem variantes) para INSERT/UPDATE. */
export function productToRow(
  input: Partial<{
    name: string;
    slug: string;
    categoryId: string | null;
    price: number;
    originalPrice: number | null;
    image: string;
    images: string[];
    badge: string;
    badgeColor: string;
    featured: boolean;
    isNew: boolean;
    shortDescription: string;
    seoTitle: string;
    seoDescription: string;
    description: string;
    materials: string[];
    careInstructions: string[];
    sizes: ProductSizeMeta[];
    colors: ProductColorMeta[];
    widthCm: number | null;
    heightCm: number | null;
    lengthCm: number | null;
    weightKg: number | null;
    faq: { question: string; answer: string }[];
    highlights: string[];
    isActive: boolean;
  }>
): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.name !== undefined) row.name = input.name;
  if (input.slug !== undefined) row.slug = input.slug;
  if (input.categoryId !== undefined) row.category_id = input.categoryId;
  if (input.price !== undefined) row.price = input.price;
  if (input.originalPrice !== undefined) row.original_price = input.originalPrice;
  if (input.image !== undefined) row.image = input.image;
  if (input.images !== undefined) row.images = input.images;
  if (input.badge !== undefined) row.badge = input.badge;
  if (input.badgeColor !== undefined) row.badge_color = input.badgeColor;
  if (input.featured !== undefined) row.featured = input.featured;
  if (input.isNew !== undefined) row.is_new = input.isNew;
  if (input.shortDescription !== undefined) row.short_description = input.shortDescription;
  if (input.seoTitle !== undefined) row.seo_title = input.seoTitle;
  if (input.seoDescription !== undefined) row.seo_description = input.seoDescription;
  if (input.description !== undefined) row.description = input.description;
  if (input.materials !== undefined) row.materials = input.materials;
  if (input.careInstructions !== undefined) row.care_instructions = input.careInstructions;
  if (input.sizes !== undefined) row.sizes = input.sizes;
  if (input.colors !== undefined) row.colors = input.colors;
  if (input.widthCm !== undefined) row.width_cm = input.widthCm;
  if (input.heightCm !== undefined) row.height_cm = input.heightCm;
  if (input.lengthCm !== undefined) row.length_cm = input.lengthCm;
  if (input.weightKg !== undefined) row.weight_kg = input.weightKg;
  if (input.faq !== undefined) row.faq = input.faq;
  if (input.highlights !== undefined) row.highlights = input.highlights;
  if (input.isActive !== undefined) row.is_active = input.isActive;
  return row;
}
