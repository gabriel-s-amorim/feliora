import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("E-mail inválido").max(254),
});
