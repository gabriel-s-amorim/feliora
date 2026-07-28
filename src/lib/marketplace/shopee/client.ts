import { SignJWT, jwtVerify } from "jose";
import {
  getChannelSettings,
  getResolvedCredentials,
  saveChannelTokens,
  signHmacSha256Hex,
} from "@/lib/marketplace/settings";

const HOST = "https://openplatform.shopee.com.br";
const AUTH_HOST = "https://partner.shopeemobile.com";

function getJwtSecret(): Uint8Array {
  const secret = process.env.ADMIN_JWT_SECRET?.trim();
  if (!secret) throw new Error("Configure ADMIN_JWT_SECRET");
  return new TextEncoder().encode(secret);
}

function timestamp(): number {
  return Math.floor(Date.now() / 1000);
}

function signPublic(partnerId: string, partnerKey: string, path: string, ts: number) {
  return signHmacSha256Hex(partnerKey, `${partnerId}${path}${ts}`);
}

function signShop(
  partnerId: string,
  partnerKey: string,
  path: string,
  ts: number,
  accessToken: string,
  shopId: string
) {
  return signHmacSha256Hex(
    partnerKey,
    `${partnerId}${path}${ts}${accessToken}${shopId}`
  );
}

type ShopeeResponse<T> = {
  error: string;
  message: string;
  request_id?: string;
  response?: T;
  warning?: string;
};

async function shopeeFetch<T>(
  path: string,
  options: {
    method?: "GET" | "POST";
    query?: Record<string, string | number | undefined>;
    body?: unknown;
    shop?: boolean;
  } = {}
): Promise<T> {
  const row = await getChannelSettings("shopee");
  const creds = getResolvedCredentials(row);
  if (!creds.partnerId || !creds.partnerKey) {
    throw new Error("Configure Partner ID e Partner Key da Shopee");
  }

  let accessToken = creds.accessToken;
  if (options.shop) {
    accessToken = await ensureShopeeAccessToken();
  }

  const ts = timestamp();
  const partnerId = Number(creds.partnerId);
  const shopId = Number(creds.shopId);
  const sign = options.shop
    ? signShop(creds.partnerId, creds.partnerKey, path, ts, accessToken, creds.shopId)
    : signPublic(creds.partnerId, creds.partnerKey, path, ts);

  const params = new URLSearchParams();
  params.set("partner_id", String(partnerId));
  params.set("timestamp", String(ts));
  params.set("sign", sign);
  if (options.shop) {
    params.set("access_token", accessToken);
    params.set("shop_id", String(shopId));
  }
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined && value !== "") params.set(key, String(value));
    }
  }

  const url = `${HOST}${path}?${params.toString()}`;
  const res = await fetch(url, {
    method: options.method ?? (options.body ? "POST" : "GET"),
    headers: { "Content-Type": "application/json" },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const json = (await res.json()) as ShopeeResponse<T>;
  if (json.error) {
    throw new Error(json.message || json.error || "Erro Shopee API");
  }
  return (json.response ?? json) as T;
}

export async function buildShopeeAuthorizeUrl(): Promise<string> {
  const row = await getChannelSettings("shopee");
  const creds = getResolvedCredentials(row);
  if (!creds.partnerId || !creds.partnerKey) {
    throw new Error("Salve Partner ID e Partner Key antes de conectar");
  }

  const path = "/api/v2/shop/auth_partner";
  const ts = timestamp();
  const sign = signPublic(creds.partnerId, creds.partnerKey, path, ts);
  const state = await new SignJWT({ purpose: "shopee_oauth" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("15m")
    .sign(getJwtSecret());

  const params = new URLSearchParams({
    partner_id: creds.partnerId,
    timestamp: String(ts),
    sign,
    redirect: creds.redirectUri,
    state,
  });

  return `${AUTH_HOST}${path}?${params.toString()}`;
}

export async function exchangeShopeeCode(code: string, shopId: string, state: string) {
  const { payload } = await jwtVerify(state, getJwtSecret());
  if (payload.purpose !== "shopee_oauth") {
    throw new Error("State OAuth inválido");
  }

  const row = await getChannelSettings("shopee");
  const creds = getResolvedCredentials(row);
  const path = "/api/v2/auth/token/get";
  const ts = timestamp();
  const sign = signPublic(creds.partnerId, creds.partnerKey, path, ts);

  const url = `${HOST}${path}?partner_id=${creds.partnerId}&timestamp=${ts}&sign=${sign}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      shop_id: Number(shopId),
      partner_id: Number(creds.partnerId),
    }),
  });
  const json = (await res.json()) as {
    error?: string;
    message?: string;
    access_token?: string;
    refresh_token?: string;
    expire_in?: number;
    shop_id?: number;
  };

  if (json.error || !json.access_token || !json.refresh_token) {
    throw new Error(json.message || json.error || "Falha ao obter token Shopee");
  }

  await saveChannelTokens("shopee", {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresIn: json.expire_in ?? 14400,
    shopId: String(json.shop_id ?? shopId),
  });
}

async function refreshShopeeToken(): Promise<string> {
  const row = await getChannelSettings("shopee");
  const creds = getResolvedCredentials(row);
  if (!creds.refreshToken) throw new Error("Shopee não conectada");

  const path = "/api/v2/auth/access_token/get";
  const ts = timestamp();
  const sign = signPublic(creds.partnerId, creds.partnerKey, path, ts);
  const url = `${HOST}${path}?partner_id=${creds.partnerId}&timestamp=${ts}&sign=${sign}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      refresh_token: creds.refreshToken,
      shop_id: Number(creds.shopId),
      partner_id: Number(creds.partnerId),
    }),
  });
  const json = (await res.json()) as {
    error?: string;
    message?: string;
    access_token?: string;
    refresh_token?: string;
    expire_in?: number;
  };

  if (json.error || !json.access_token || !json.refresh_token) {
    throw new Error(json.message || "Falha ao renovar token Shopee");
  }

  await saveChannelTokens("shopee", {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresIn: json.expire_in ?? 14400,
    shopId: creds.shopId,
  });

  return json.access_token;
}

export async function ensureShopeeAccessToken(): Promise<string> {
  const row = await getChannelSettings("shopee");
  const creds = getResolvedCredentials(row);
  if (!creds.accessToken || !creds.shopId) {
    throw new Error("Conecte a loja Shopee em Integrações");
  }
  const skewMs = 5 * 60 * 1000;
  if (creds.tokenExpiresAt && creds.tokenExpiresAt - Date.now() > skewMs) {
    return creds.accessToken;
  }
  return refreshShopeeToken();
}

export async function shopeeGetItemList(offset = 0, pageSize = 50) {
  return shopeeFetch<{
    item?: Array<{ item_id: number; item_status: string }>;
    total_count?: number;
    has_next_page?: boolean;
    next_offset?: number;
  }>("/api/v2/product/get_item_list", {
    shop: true,
    query: {
      offset,
      page_size: pageSize,
      item_status: "NORMAL",
    },
  });
}

export async function shopeeGetItemBaseInfo(itemIds: number[]) {
  return shopeeFetch<{
    item_list?: Array<{
      item_id: number;
      item_name: string;
      description?: string;
      item_sku?: string;
      price_info?: Array<{ current_price?: number; original_price?: number }>;
      stock_info_v2?: {
        summary_info?: { total_available_stock?: number };
      };
      image?: { image_url_list?: string[] };
      category_id?: number;
      weight?: string;
      dimension?: {
        package_length?: number;
        package_width?: number;
        package_height?: number;
      };
      model_list?: Array<{
        model_id: number;
        model_sku?: string;
        stock_info_v2?: {
          summary_info?: { total_available_stock?: number };
        };
        price_info?: Array<{ current_price?: number }>;
      }>;
    }>;
  }>("/api/v2/product/get_item_base_info", {
    shop: true,
    query: {
      item_id_list: itemIds.join(","),
    },
  });
}

export async function shopeeGetModelList(itemId: number) {
  return shopeeFetch<{
    model?: Array<{
      model_id: number;
      model_sku?: string;
      stock_info_v2?: {
        summary_info?: { total_available_stock?: number };
      };
      price_info?: Array<{ current_price?: number }>;
      tier_index?: number[];
    }>;
    tier_variation?: Array<{
      name: string;
      option_list: Array<{ option: string }>;
    }>;
  }>("/api/v2/product/get_model_list", {
    shop: true,
    method: "GET",
    query: { item_id: itemId },
  });
}

export async function shopeeGetCategory() {
  return shopeeFetch<{
    category_list?: Array<{
      category_id: number;
      parent_category_id: number;
      original_category_name: string;
      display_category_name: string;
      has_children: boolean;
    }>;
  }>("/api/v2/product/get_category", {
    shop: true,
    query: { language: "pt-br" },
  });
}

export async function shopeeGetChannelList() {
  return shopeeFetch<{
    logistics_channel_list?: Array<{
      logistics_channel_id: number;
      logistics_channel_name: string;
      enabled: boolean;
    }>;
  }>("/api/v2/logistics/get_channel_list", { shop: true });
}

export async function shopeeUploadImage(imageUrl: string): Promise<string> {
  // Baixa a imagem e faz upload via media_space (multipart simplificado via URL fetch no servidor)
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Falha ao baixar imagem: ${imageUrl}`);
  const buffer = Buffer.from(await imgRes.arrayBuffer());
  const contentType = imgRes.headers.get("content-type") || "image/jpeg";

  const row = await getChannelSettings("shopee");
  const creds = getResolvedCredentials(row);
  const accessToken = await ensureShopeeAccessToken();
  const path = "/api/v2/media_space/upload_image";
  const ts = timestamp();
  const sign = signShop(
    creds.partnerId,
    creds.partnerKey,
    path,
    ts,
    accessToken,
    creds.shopId
  );

  const form = new FormData();
  form.append(
    "image",
    new Blob([new Uint8Array(buffer)], { type: contentType }),
    "product.jpg"
  );

  const params = new URLSearchParams({
    partner_id: creds.partnerId,
    timestamp: String(ts),
    sign,
    access_token: accessToken,
    shop_id: creds.shopId,
  });

  const res = await fetch(`${HOST}${path}?${params.toString()}`, {
    method: "POST",
    body: form,
  });
  const json = (await res.json()) as ShopeeResponse<{
    image_info?: { image_id?: string };
  }>;
  if (json.error || !json.response?.image_info?.image_id) {
    throw new Error(json.message || "Falha no upload de imagem Shopee");
  }
  return json.response.image_info.image_id;
}

export async function shopeeAddItem(body: Record<string, unknown>) {
  return shopeeFetch<{ item_id: number }>("/api/v2/product/add_item", {
    shop: true,
    method: "POST",
    body,
  });
}

export async function shopeeInitTierVariation(
  itemId: number,
  tierVariation: Array<{
    name: string;
    option_list: Array<{ option: string }>;
  }>,
  model: Array<{
    tier_index: number[];
    normal_stock: number;
    original_price: number;
    model_sku: string;
  }>
) {
  return shopeeFetch("/api/v2/product/init_tier_variation", {
    shop: true,
    method: "POST",
    body: {
      item_id: itemId,
      tier_variation: tierVariation,
      model,
    },
  });
}

export async function shopeeUpdateStock(
  itemId: number,
  stockList: Array<{ model_id?: number; seller_stock: Array<{ stock: number }> }>
) {
  return shopeeFetch("/api/v2/product/update_stock", {
    shop: true,
    method: "POST",
    body: { item_id: itemId, stock_list: stockList },
  });
}

export async function shopeeUpdatePrice(
  itemId: number,
  priceList: Array<{ model_id?: number; original_price: number }>
) {
  return shopeeFetch("/api/v2/product/update_price", {
    shop: true,
    method: "POST",
    body: { item_id: itemId, price_list: priceList },
  });
}

export async function shopeeGetOrderDetail(orderSnList: string[]) {
  return shopeeFetch<{
    order_list?: Array<{
      order_sn: string;
      order_status: string;
      item_list?: Array<{
        item_id: number;
        model_id?: number;
        model_sku?: string;
        item_sku?: string;
        model_quantity_purchased?: number;
      }>;
    }>;
  }>("/api/v2/order/get_order_detail", {
    shop: true,
    query: {
      order_sn_list: orderSnList.join(","),
      response_optional_fields: "item_list",
    },
  });
}

export function verifyShopeePushSign(
  partnerKey: string,
  requestBody: string,
  authorization: string | null
): boolean {
  if (!authorization) return false;
  const expected = signHmacSha256Hex(partnerKey, requestBody);
  return expected === authorization || expected === authorization.toLowerCase();
}
