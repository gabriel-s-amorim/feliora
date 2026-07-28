import { z } from "zod";

const nullablePositiveInteger = z.number().int().positive().nullable();

export const brevoSettingsSchema = z.object({
  enabled: z.boolean(),
  apiKey: z.string().trim().max(500).optional(),
  webhookToken: z.string().trim().min(32).max(500).optional(),
  defaultSenderId: nullablePositiveInteger.optional(),
  defaultSenderEmail: z.union([z.literal(""), z.email().max(320)]).optional(),
  defaultSenderName: z.string().trim().max(150).optional(),
  replyTo: z.union([z.literal(""), z.email().max(320)]).optional(),
  merchantNotifyEmail: z.union([z.literal(""), z.email().max(320)]).optional(),
  defaultListId: nullablePositiveInteger.optional(),
  templateOrderReceived: nullablePositiveInteger.optional(),
  templateOrderReceivedMerchant: nullablePositiveInteger.optional(),
  templatePaymentApproved: nullablePositiveInteger.optional(),
  templatePaymentFailed: nullablePositiveInteger.optional(),
  templatePaymentRefunded: nullablePositiveInteger.optional(),
  templateOrderProcessing: nullablePositiveInteger.optional(),
  templateOrderShipped: nullablePositiveInteger.optional(),
  templateOrderDelivered: nullablePositiveInteger.optional(),
});

export const brevoTemplateTestSchema = z.object({
  event: z.enum([
    "order_received",
    "order_received_merchant",
    "payment_approved",
  ]),
  email: z.email().max(320),
});

export const brevoStoreTemplateUpdateSchema = z.object({
  event: z.enum([
    "order_received",
    "order_received_merchant",
    "payment_approved",
  ]),
  name: z.string().trim().min(1).max(150).optional(),
  subject: z.string().trim().min(1).max(998),
  htmlContent: z.string().trim().min(1).max(1_000_000),
  enabled: z.boolean().optional(),
});

export const newsletterSubscribeSchema = z.object({
  email: z.email().max(320),
  consent: z.literal(true),
  name: z.string().trim().max(150).optional(),
  source: z.string().trim().max(80).optional(),
  website: z.string().max(0).optional(),
});

export type BrevoSettingsSchemaInput = z.infer<typeof brevoSettingsSchema>;
export type NewsletterSubscribeSchemaInput = z.infer<
  typeof newsletterSubscribeSchema
>;
