import type {
  MarketplaceChannel,
  MarketplaceChannelStatus,
  MarketplaceCategoryMap,
  MarketplaceJobStatus,
  MarketplaceJobType,
  MarketplaceLinkStatus,
  MarketplaceProductLink,
  MarketplaceSyncJob,
} from "@/shared/types/marketplace";

export type MarketplaceChannelSettingsRow = {
  channel: MarketplaceChannel;
  enabled: boolean;
  partner_id: string;
  partner_key_encrypted: string | null;
  app_key: string;
  app_secret_encrypted: string | null;
  service_id: string;
  shop_id: string;
  shop_cipher: string;
  shop_name: string;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  token_expires_at: string | null;
  refresh_expires_at: string | null;
  webhook_secret_encrypted: string | null;
  redirect_uri: string;
  warehouse_id: string;
  connected_at: string | null;
  last_sync_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

export type MarketplaceProductLinkRow = {
  id: string;
  channel: MarketplaceChannel;
  product_id: number;
  external_item_id: string;
  status: MarketplaceLinkStatus;
  last_error: string | null;
  last_synced_at: string | null;
  remote_payload: unknown;
  created_at: string;
  updated_at: string;
};

export type MarketplaceVariantLinkRow = {
  id: string;
  channel: MarketplaceChannel;
  variant_id: string;
  product_link_id: string;
  external_model_id: string;
  external_sku_id: string;
  external_sku: string;
  created_at: string;
  updated_at: string;
};

export type MarketplaceSyncJobRow = {
  id: string;
  channel: MarketplaceChannel | null;
  job_type: MarketplaceJobType;
  direction: "inbound" | "outbound" | "both";
  status: MarketplaceJobStatus;
  progress: number;
  total_items: number;
  done_items: number;
  payload: Record<string, unknown>;
  errors: Array<{ message: string; productId?: number; externalId?: string }>;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MarketplaceCategoryMapRow = {
  id: string;
  channel: MarketplaceChannel;
  feliora_category_id: string;
  external_category_id: string;
  external_category_name: string;
  attributes_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export function mapChannelStatus(
  row: MarketplaceChannelSettingsRow,
  extras: {
    hasPartnerKey: boolean;
    hasAppSecret: boolean;
    connected: boolean;
    webhookUrl: string;
    suggestedRedirectUri: string;
  }
): MarketplaceChannelStatus {
  return {
    channel: row.channel,
    enabled: row.enabled,
    connected: extras.connected,
    partnerId: row.partner_id,
    appKey: row.app_key,
    serviceId: row.service_id,
    shopId: row.shop_id,
    shopName: row.shop_name,
    warehouseId: row.warehouse_id,
    hasPartnerKey: extras.hasPartnerKey,
    hasAppSecret: extras.hasAppSecret,
    connectedAt: row.connected_at,
    lastSyncAt: row.last_sync_at,
    lastError: row.last_error,
    tokenExpiresAt: row.token_expires_at,
    redirectUri: row.redirect_uri,
    webhookUrl: extras.webhookUrl,
    suggestedRedirectUri: extras.suggestedRedirectUri,
  };
}

export function mapProductLink(
  row: MarketplaceProductLinkRow
): MarketplaceProductLink {
  return {
    id: row.id,
    channel: row.channel,
    productId: row.product_id,
    externalItemId: row.external_item_id,
    status: row.status,
    lastError: row.last_error,
    lastSyncedAt: row.last_synced_at,
  };
}

export function mapSyncJob(row: MarketplaceSyncJobRow): MarketplaceSyncJob {
  return {
    id: row.id,
    channel: row.channel,
    jobType: row.job_type,
    direction: row.direction,
    status: row.status,
    progress: row.progress,
    totalItems: row.total_items,
    doneItems: row.done_items,
    errors: Array.isArray(row.errors) ? row.errors : [],
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    createdAt: row.created_at,
  };
}

export function mapCategoryMap(
  row: MarketplaceCategoryMapRow
): MarketplaceCategoryMap {
  return {
    id: row.id,
    channel: row.channel,
    felioraCategoryId: row.feliora_category_id,
    externalCategoryId: row.external_category_id,
    externalCategoryName: row.external_category_name,
    attributesJson: row.attributes_json ?? {},
  };
}
