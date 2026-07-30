import { z } from "zod";

export const markNotificationsSchema = z
  .object({
    notificationId: z.string().uuid("Notificação inválida").optional(),
    notificationIds: z
      .array(z.string().uuid("Notificação inválida"))
      .min(1)
      .max(100)
      .optional(),
    markAll: z.boolean().optional(),
  })
  .superRefine((value, context) => {
    const hasIds =
      Boolean(value.notificationId) ||
      Boolean(value.notificationIds?.length);
    if (!value.markAll && !hasIds) {
      context.addIssue({
        code: "custom",
        message: "Informe notificationId, notificationIds ou markAll",
      });
    }
  });

export const sendOrderMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Escreva uma mensagem")
    .max(2000, "Mensagem muito longa (máx. 2000 caracteres)"),
});

export type MarkNotificationsInput = z.infer<typeof markNotificationsSchema>;
export type SendOrderMessageInput = z.infer<typeof sendOrderMessageSchema>;
