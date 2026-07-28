import { z } from "zod";

const slugSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido");

export const productSizeMetaSchema = z.object({
  label: z.string().trim().min(1),
});

export const productColorMetaSchema = z.object({
  name: z.string().trim().min(1),
  hex: z
    .string()
    .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Hex inválido"),
});

export const productVariantInputSchema = z.object({
  sizeLabel: z.string().trim().min(1),
  colorName: z.string().trim().default(""),
  sku: z.string().trim().min(1).max(64),
  stockCount: z.number().int().min(0),
  isActive: z.boolean().default(true),
});

export const productCreateSchema = z.object({
  name: z.string().trim().min(1).max(160),
  slug: slugSchema,
  categoryId: z.string().uuid().nullable(),
  price: z.number().min(0),
  originalPrice: z.number().min(0).nullable().optional(),
  image: z.string().default(""),
  images: z.array(z.string()).default([]),
  badge: z.string().max(40).default(""),
  badgeColor: z.string().default("#B76E79"),
  featured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  shortDescription: z.string().max(500).default(""),
  description: z.string().default(""),
  materials: z.array(z.string()).default([]),
  careInstructions: z.array(z.string()).default([]),
  sizes: z.array(productSizeMetaSchema).default([]),
  colors: z.array(productColorMetaSchema).default([]),
  widthCm: z.number().nullable().optional(),
  heightCm: z.number().nullable().optional(),
  lengthCm: z.number().nullable().optional(),
  weightKg: z.number().nullable().optional(),
  faq: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .default([]),
  highlights: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  variants: z.array(productVariantInputSchema).min(1, "Informe ao menos uma variante"),
});

export const productUpdateSchema = productCreateSchema.partial();

export const stockDecrementItemSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const stockDecrementPayloadSchema = z.array(stockDecrementItemSchema).min(1);

export type ProductVariantInput = z.infer<typeof productVariantInputSchema>;
export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
