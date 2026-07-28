import { z } from "zod";

export const cartAddSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().positive().max(20).default(1),
});

export const cartUpdateSchema = z.object({
  quantity: z.number().int().min(0).max(20),
});

export type CartAddInput = z.infer<typeof cartAddSchema>;
export type CartUpdateInput = z.infer<typeof cartUpdateSchema>;
