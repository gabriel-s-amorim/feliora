import { z } from "zod";
import { normalizeCouponCode } from "@/shared/lib/coupons";

const couponTypeSchema = z.enum(["percentage", "fixed"]);

export const couponCreateSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, "Código obrigatório")
      .max(64)
      .transform(normalizeCouponCode),
    type: couponTypeSchema,
    value: z.number().finite(),
    isActive: z.boolean().default(true),
    endsAt: z
      .union([z.string().datetime({ offset: true }), z.null()])
      .optional(),
    minSubtotal: z.number().finite().nonnegative().nullable().optional(),
    maxUses: z.number().int().positive().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "percentage") {
      if (data.value <= 0 || data.value > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["value"],
          message: "Percentual deve ser entre 0 e 100",
        });
      }
    } else if (data.value < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["value"],
        message: "Valor fixo não pode ser negativo",
      });
    }
  });

export const couponUpdateSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1)
      .max(64)
      .transform(normalizeCouponCode)
      .optional(),
    type: couponTypeSchema.optional(),
    value: z.number().finite().optional(),
    isActive: z.boolean().optional(),
    endsAt: z
      .union([z.string().datetime({ offset: true }), z.null()])
      .optional(),
    minSubtotal: z.number().finite().nonnegative().nullable().optional(),
    maxUses: z.number().int().positive().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "percentage" && data.value != null) {
      if (data.value <= 0 || data.value > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["value"],
          message: "Percentual deve ser entre 0 e 100",
        });
      }
    }
    if (data.type === "fixed" && data.value != null && data.value < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["value"],
        message: "Valor fixo não pode ser negativo",
      });
    }
  });

export type CouponCreateInput = z.infer<typeof couponCreateSchema>;
export type CouponUpdateInput = z.infer<typeof couponUpdateSchema>;
