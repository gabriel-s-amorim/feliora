import { z } from "zod";

export const marketplaceChannelSchema = z.enum(["shopee", "tiktok"]);

export const marketplaceSettingsUpdateSchema = z.object({
  enabled: z.boolean().optional(),
  partnerId: z.string().optional(),
  partnerKey: z.string().optional(),
  appKey: z.string().optional(),
  appSecret: z.string().optional(),
  serviceId: z.string().optional(),
  warehouseId: z.string().optional(),
  redirectUri: z.string().url().or(z.literal("")).optional(),
});

export const marketplaceImportSchema = z.object({
  channel: marketplaceChannelSchema,
  externalItemIds: z.array(z.string().min(1)).min(1).max(50),
  categoryId: z.string().nullable().optional(),
});

export const marketplaceExportSchema = z.object({
  channels: z.array(marketplaceChannelSchema).min(1),
  productIds: z.array(z.number().int().positive()).min(1).max(50),
});

export const marketplaceSyncSchema = z.object({
  type: z.enum(["price", "stock", "full"]),
  channels: z.array(marketplaceChannelSchema).optional(),
  productIds: z.array(z.number().int().positive()).optional(),
});

export const marketplaceCategoryMapSchema = z.object({
  channel: marketplaceChannelSchema,
  felioraCategoryId: z.string().min(1),
  externalCategoryId: z.string().min(1),
  externalCategoryName: z.string().optional(),
  attributesJson: z.record(z.string(), z.unknown()).optional(),
});

export type MarketplaceSettingsUpdateInput = z.infer<
  typeof marketplaceSettingsUpdateSchema
>;
export type MarketplaceImportInput = z.infer<typeof marketplaceImportSchema>;
export type MarketplaceExportInput = z.infer<typeof marketplaceExportSchema>;
export type MarketplaceSyncInput = z.infer<typeof marketplaceSyncSchema>;
export type MarketplaceCategoryMapInput = z.infer<
  typeof marketplaceCategoryMapSchema
>;
