import { z } from "zod";
import { isValidPhoneBr, normalizePhoneBr } from "@/shared/lib/phoneBr";

export const adminCustomerUpdateSchema = z.object({
  fullName: z.string().trim().min(2, "Informe o nome completo").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  phone: z
    .string()
    .trim()
    .transform(normalizePhoneBr)
    .refine((value) => !value || isValidPhoneBr(value), "Telefone inválido"),
});
