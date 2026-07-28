import { createHmac } from "node:crypto";
import {
  decryptStoredSecret,
  encryptSecret,
  type SecretEncryptionKey,
} from "@/lib/crypto/secretCrypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicAppUrl } from "@/lib/mercadoPago/service";
import type { MarketplaceSettingsUpdateInput } from "@/shared/schemas/marketplace";
import type { MarketplaceChannel } from "@/shared/types/marketplace";
import {
  mapChannelStatus,
  type MarketplaceChannelSettingsRow,
} from "@/shared/lib/marketplaceMapper";

const SHOPEE_KEY: SecretEncryptionKey = "SHOPEE_ENCRYPTION_KEY";
const TIKTOK_KEY: SecretEncryptionKey = "TIKTOK_ENCRYPTION_KEY";

function cryptoKeyFor(channel: MarketplaceChannel): SecretEncryptionKey {
  return channel === "shopee" ? SHOPEE_KEY : TIKTOK_KEY;
}

function encryptChannelSecret(
  channel: MarketplaceChannel,
  value: string
): string {
  return encryptSecret(value, cryptoKeyFor(channel));
}

export function decryptChannelSecret(
  channel: MarketplaceChannel,
  value: string | null | undefined
): string {
  if (!value) return "";
  return decryptStoredSecret(value, cryptoKeyFor(channel));
}

function getDb() {
  return createAdminClient();
}

export function getMarketplaceRedirectUri(channel: MarketplaceChannel): string {
  return `${getPublicAppUrl()}/api/admin/marketplace/${channel}/callback`;
}

export function getMarketplaceWebhookUrl(channel: MarketplaceChannel): string {
  return `${getPublicAppUrl()}/api/webhooks/${channel}`;
}

export async function getChannelSettings(
  channel: MarketplaceChannel
): Promise<MarketplaceChannelSettingsRow> {
  const supabase = getDb();
  const { data, error } = await supabase
    .from("marketplace_channel_settings")
    .select("*")
    .eq("channel", channel)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Tabela marketplace_channel_settings não encontrada. Execute supabase/15_marketplace_channels.sql. (${error.message})`
    );
  }

  if (!data) {
    const { data: inserted, error: insertError } = await supabase
      .from("marketplace_channel_settings")
      .insert({
        channel,
        redirect_uri: getMarketplaceRedirectUri(channel),
      })
      .select("*")
      .single();
    if (insertError) throw new Error(insertError.message);
    return inserted as MarketplaceChannelSettingsRow;
  }

  return data as MarketplaceChannelSettingsRow;
}

export async function getChannelAdminStatus(channel: MarketplaceChannel) {
  const row = await getChannelSettings(channel);
  const partnerKey = decryptChannelSecret(channel, row.partner_key_encrypted);
  const appSecret = decryptChannelSecret(channel, row.app_secret_encrypted);
  const accessToken = decryptChannelSecret(channel, row.access_token_encrypted);
  const connected = Boolean(accessToken && row.shop_id);

  return mapChannelStatus(row, {
    hasPartnerKey: Boolean(partnerKey),
    hasAppSecret: Boolean(appSecret),
    connected,
    webhookUrl: getMarketplaceWebhookUrl(channel),
    suggestedRedirectUri: getMarketplaceRedirectUri(channel),
  });
}

export async function updateChannelSettings(
  channel: MarketplaceChannel,
  input: MarketplaceSettingsUpdateInput
) {
  const row = await getChannelSettings(channel);
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.enabled !== undefined) patch.enabled = input.enabled;
  if (input.partnerId !== undefined) patch.partner_id = input.partnerId.trim();
  if (input.appKey !== undefined) patch.app_key = input.appKey.trim();
  if (input.serviceId !== undefined) patch.service_id = input.serviceId.trim();
  if (input.warehouseId !== undefined) {
    patch.warehouse_id = input.warehouseId.trim();
  }
  if (input.redirectUri !== undefined) {
    patch.redirect_uri =
      input.redirectUri.trim() || getMarketplaceRedirectUri(channel);
  }

  if (input.partnerKey?.trim()) {
    patch.partner_key_encrypted = encryptChannelSecret(
      channel,
      input.partnerKey.trim()
    );
  }
  if (input.appSecret?.trim()) {
    patch.app_secret_encrypted = encryptChannelSecret(
      channel,
      input.appSecret.trim()
    );
  }

  const supabase = getDb();
  const { error } = await supabase
    .from("marketplace_channel_settings")
    .update(patch)
    .eq("channel", channel);
  if (error) throw new Error(error.message);

  void row;
  return getChannelAdminStatus(channel);
}

export async function saveChannelTokens(
  channel: MarketplaceChannel,
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    refreshExpiresIn?: number;
    shopId: string;
    shopCipher?: string;
    shopName?: string;
  }
) {
  const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000).toISOString();
  const refreshExpiresAt = tokens.refreshExpiresIn
    ? new Date(Date.now() + tokens.refreshExpiresIn * 1000).toISOString()
    : null;

  const supabase = getDb();
  const { error } = await supabase
    .from("marketplace_channel_settings")
    .update({
      access_token_encrypted: encryptChannelSecret(channel, tokens.accessToken),
      refresh_token_encrypted: encryptChannelSecret(
        channel,
        tokens.refreshToken
      ),
      token_expires_at: expiresAt,
      refresh_expires_at: refreshExpiresAt,
      shop_id: tokens.shopId,
      shop_cipher: tokens.shopCipher ?? "",
      shop_name: tokens.shopName ?? "",
      connected_at: new Date().toISOString(),
      last_error: null,
      enabled: true,
    })
    .eq("channel", channel);

  if (error) throw new Error(error.message);
}

export async function disconnectChannel(channel: MarketplaceChannel) {
  const supabase = getDb();
  const { error } = await supabase
    .from("marketplace_channel_settings")
    .update({
      access_token_encrypted: null,
      refresh_token_encrypted: null,
      token_expires_at: null,
      refresh_expires_at: null,
      shop_id: "",
      shop_cipher: "",
      shop_name: "",
      connected_at: null,
      enabled: false,
      last_error: null,
    })
    .eq("channel", channel);
  if (error) throw new Error(error.message);
  return getChannelAdminStatus(channel);
}

export async function markChannelError(
  channel: MarketplaceChannel,
  message: string
) {
  const supabase = getDb();
  await supabase
    .from("marketplace_channel_settings")
    .update({ last_error: message })
    .eq("channel", channel);
}

export async function touchChannelSync(channel: MarketplaceChannel) {
  const supabase = getDb();
  await supabase
    .from("marketplace_channel_settings")
    .update({ last_sync_at: new Date().toISOString(), last_error: null })
    .eq("channel", channel);
}

export function signHmacSha256Hex(secret: string, base: string): string {
  return createHmac("sha256", secret).update(base).digest("hex");
}

export function getResolvedCredentials(row: MarketplaceChannelSettingsRow) {
  const channel = row.channel;
  return {
    partnerId: row.partner_id.trim(),
    partnerKey: decryptChannelSecret(channel, row.partner_key_encrypted),
    appKey: row.app_key.trim(),
    appSecret: decryptChannelSecret(channel, row.app_secret_encrypted),
    serviceId: row.service_id.trim(),
    shopId: row.shop_id.trim(),
    shopCipher: row.shop_cipher.trim(),
    warehouseId: row.warehouse_id.trim(),
    accessToken: decryptChannelSecret(channel, row.access_token_encrypted),
    refreshToken: decryptChannelSecret(channel, row.refresh_token_encrypted),
    tokenExpiresAt: row.token_expires_at
      ? new Date(row.token_expires_at).getTime()
      : 0,
    redirectUri: row.redirect_uri.trim() || getMarketplaceRedirectUri(channel),
  };
}
