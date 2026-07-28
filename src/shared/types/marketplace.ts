export type MarketplaceChannel = "shopee" | "tiktok";

export type MarketplaceLinkStatus =
  | "draft"
  | "listed"
  | "error"
  | "unlinked";

export type MarketplaceJobType =
  | "import"
  | "export"
  | "price"
  | "stock"
  | "full";

export type MarketplaceJobStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "partial";

export type MarketplaceChannelStatus = {
  channel: MarketplaceChannel;
  enabled: boolean;
  connected: boolean;
  partnerId: string;
  appKey: string;
  serviceId: string;
  shopId: string;
  shopName: string;
  warehouseId: string;
  hasPartnerKey: boolean;
  hasAppSecret: boolean;
  connectedAt: string | null;
  lastSyncAt: string | null;
  lastError: string | null;
  tokenExpiresAt: string | null;
  redirectUri: string;
  webhookUrl: string;
  suggestedRedirectUri: string;
};

export type MarketplaceCategoryMap = {
  id: string;
  channel: MarketplaceChannel;
  felioraCategoryId: string;
  externalCategoryId: string;
  externalCategoryName: string;
  attributesJson: Record<string, unknown>;
};

export type MarketplaceProductLink = {
  id: string;
  channel: MarketplaceChannel;
  productId: number;
  externalItemId: string;
  status: MarketplaceLinkStatus;
  lastError: string | null;
  lastSyncedAt: string | null;
};

export type MarketplaceSyncJob = {
  id: string;
  channel: MarketplaceChannel | null;
  jobType: MarketplaceJobType;
  direction: "inbound" | "outbound" | "both";
  status: MarketplaceJobStatus;
  progress: number;
  totalItems: number;
  doneItems: number;
  errors: Array<{ message: string; productId?: number; externalId?: string }>;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
};

export type MarketplaceRemoteProduct = {
  externalItemId: string;
  name: string;
  price: number | null;
  stock: number | null;
  imageUrl: string | null;
  status: string;
  sku: string | null;
  alreadyLinked: boolean;
  linkedProductId: number | null;
};

export type MarketplaceRemoteCategory = {
  id: string;
  name: string;
  parentId: string | null;
  hasChildren: boolean;
};

export type MarketplaceExportReadiness = {
  productId: number;
  ready: boolean;
  missing: string[];
};
