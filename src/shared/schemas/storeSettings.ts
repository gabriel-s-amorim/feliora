import { z } from "zod";

const optionalUrl = z.string().trim().max(500);

const optionalEmail = z
  .string()
  .trim()
  .max(200)
  .refine((v) => v === "" || z.string().email().safeParse(v).success, {
    message: "E-mail inválido",
  });

export const storeSettingsSchema = z.object({
  contactEmail: optionalEmail,
  whatsappNumber: z
    .string()
    .trim()
    .max(20)
    .refine((v) => v === "" || /^\d{10,20}$/.test(v), {
      message: "Use apenas dígitos (DDI + DDD + número)",
    }),
  whatsappDisplay: z.string().trim().max(40),
  addressLine: z.string().trim().max(200),
  instagramUrl: optionalUrl,
  facebookUrl: optionalUrl,
  tiktokUrl: optionalUrl,
  twitterUrl: optionalUrl,
});

export type StoreSettingsSchemaInput = z.infer<typeof storeSettingsSchema>;
