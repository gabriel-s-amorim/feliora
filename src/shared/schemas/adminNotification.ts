import { z } from "zod";

export const markAdminNotificationsSchema = z
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

export type MarkAdminNotificationsInput = z.infer<
  typeof markAdminNotificationsSchema
>;
