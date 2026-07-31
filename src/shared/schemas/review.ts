import { z } from "zod";

export const createProductReviewSchema = z.object({
  productId: z.number().int().positive(),
  productSlug: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido"),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).default(""),
  body: z.string().trim().min(10, "Escreva pelo menos 10 caracteres").max(2000),
  authorName: z.string().trim().min(1).max(80).optional(),
});

export type CreateProductReviewInput = z.infer<typeof createProductReviewSchema>;

export const adminReviewActionSchema = z.object({
  reviewId: z.string().uuid("Avaliação inválida"),
  action: z.enum(["approve", "reject"]),
});

export type AdminReviewActionInput = z.infer<typeof adminReviewActionSchema>;
