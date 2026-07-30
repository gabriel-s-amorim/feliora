import { z } from "zod";

export const analyticsRangeSchema = z.enum([
  "today",
  "yesterday",
  "7d",
  "30d",
  "month",
]);

export const analyticsCollectSchema = z.object({
  visitorId: z.string().uuid(),
  sessionId: z.string().uuid(),
  path: z
    .string()
    .trim()
    .min(1)
    .max(300)
    .refine((value) => value.startsWith("/"), "Path inválido"),
  referrerHost: z.string().trim().max(120).optional().default(""),
  deviceType: z.enum(["mobile", "tablet", "desktop"]).default("desktop"),
  kind: z.enum(["pageview", "heartbeat"]).default("pageview"),
});

export type AnalyticsCollectInput = z.infer<typeof analyticsCollectSchema>;
export type AnalyticsRangeInput = z.infer<typeof analyticsRangeSchema>;
