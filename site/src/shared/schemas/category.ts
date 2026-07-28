import { z } from "zod";

const slugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido (use kebab-case)");

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório").max(80),
  slug: slugSchema,
  description: z.string().max(2000).default(""),
  seoTitle: z.string().max(120).default(""),
  seoDescription: z.string().max(300).default(""),
  imageUrl: z.string().url().nullable().optional().or(z.literal("").transform(() => null)),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const categoryUpdateSchema = categoryCreateSchema.partial();

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
