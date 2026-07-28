import { createHmac } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import {
  getChannelSettings,
  getResolvedCredentials,
  saveChannelTokens,
} from "@/lib/marketplace/settings";

const API_HOST = "https://open-api.tiktokglobalshop.com";
const AUTH_HOST = "https://auth.tiktok-shops.com";
const AUTHORIZE_URL = "https://services.tiktokshop.com/open/authorize";

function getJwtSecret(): Uint8Array {
  const secret = process.env.ADMIN_JWT_SECRET?.trim();
  if (!secret) throw new Error("Configure ADMIN_JWT_SECRET");
  return new TextEncoder().encode(secret);
}

function timestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/** Assinatura TikTok Shop: HMAC-SHA256(app_secret, app_key + timestamp + ...sorted query/body) */
function signTikTokRequest(
  appSecret: string,
  appKey: string,
  ts: number,
  path: string,
  query: Record<string, string>,
  body?: string
): string {
  const sortedKeys = Object.keys(query)
    .filter((k) => k !== "sign" && query[k] !== undefined)
    .sort();
  let input = `${appSecret}${appKey}${ts}`;
  // Algoritmo comum Partner API: app_secret + path + sorted keyvalue + body + app_secret
  let base = appSecret + path;
  for (const key of sortedKeys) {
    base += key + query[key];
  }
  if (body) base += body;
  base += appSecret;
  void input;
  return createHmac("sha256", appSecret).update(base).digest("hex");
}

type TikTokResponse<T> = {
  code: number;
  message: string;
  data?: T;
  request_id?: string;
};

async function tiktokFetch<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT";
    query?: Record<string, string>;
    body?: unknown;
    auth?: boolean;
  } = {}
): Promise<T> {
  const row = await getChannelSettings("tiktok");
  const creds = getResolvedCredentials(row);
  if (!creds.appKey || !creds.appSecret) {
    throw new Error("Configure App Key e App Secret do TikTok Shop");
  }

  let accessToken = creds.accessToken;
  if (options.auth !== false) {
    accessToken = await ensureTikTokAccessToken();
  }

  const ts = String(timestamp());
  const query: Record<string, string> = {
    app_key: creds.appKey,
    timestamp: ts,
    ...(options.query ?? {}),
  };
  if (creds.shopCipher) query.shop_cipher = creds.shopCipher;

  const bodyStr = options.body ? JSON.stringify(options.body) : undefined;
  const sign = signTikTokRequest(
    creds.appSecret,
    creds.appKey,
    Number(ts),
    path,
    query,
    bodyStr
  );
  query.sign = sign;

  const url = `${API_HOST}${path}?${new URLSearchParams(query).toString()}`;
  const res = await fetch(url, {
    method: options.method ?? (bodyStr ? "POST" : "GET"),
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { "x-tts-access-token": accessToken } : {}),
    },
    body: bodyStr,
  });

  const json = (await res.json()) as TikTokResponse<T>;
  if (json.code !== 0) {
    throw new Error(json.message || `TikTok API error ${json.code}`);
  }
  return json.data as T;
}

export async function buildTikTokAuthorizeUrl(): Promise<string> {
  const row = await getChannelSettings("tiktok");
  const creds = getResolvedCredentials(row);
  if (!creds.appKey || !creds.appSecret || !creds.serviceId) {
    throw new Error("Salve App Key, App Secret e Service ID antes de conectar");
  }

  const state = await new SignJWT({ purpose: "tiktok_oauth" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("15m")
    .sign(getJwtSecret());

  const params = new URLSearchParams({
    service_id: creds.serviceId,
    state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

export async function exchangeTikTokCode(code: string, state: string) {
  const { payload } = await jwtVerify(state, getJwtSecret());
  if (payload.purpose !== "tiktok_oauth") {
    throw new Error("State OAuth inválido");
  }

  const row = await getChannelSettings("tiktok");
  const creds = getResolvedCredentials(row);

  const res = await fetch(`${AUTH_HOST}/api/v2/token/get`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_key: creds.appKey,
      app_secret: creds.appSecret,
      auth_code: code,
      grant_type: "authorized_code",
    }),
  });

  const json = (await res.json()) as {
    code?: number;
    message?: string;
    data?: {
      access_token: string;
      refresh_token: string;
      access_token_expire_in: number;
      refresh_token_expire_in: number;
      seller_name?: string;
      open_id?: string;
    };
  };

  if ((json.code !== undefined && json.code !== 0) || !json.data?.access_token) {
    throw new Error(json.message || "Falha ao obter token TikTok");
  }

  // Busca shop autorizado
  const shops = await listAuthorizedShopsWithToken(
    creds.appKey,
    creds.appSecret,
    json.data.access_token
  );
  const shop = shops[0];
  if (!shop) {
    throw new Error("Nenhuma loja autorizada encontrada no TikTok Shop");
  }

  await saveChannelTokens("tiktok", {
    accessToken: json.data.access_token,
    refreshToken: json.data.refresh_token,
    expiresIn: json.data.access_token_expire_in ?? 604800,
    refreshExpiresIn: json.data.refresh_token_expire_in,
    shopId: shop.id,
    shopCipher: shop.cipher,
    shopName: shop.name || json.data.seller_name || "",
  });
}

async function listAuthorizedShopsWithToken(
  appKey: string,
  appSecret: string,
  accessToken: string
): Promise<Array<{ id: string; cipher: string; name: string }>> {
  const path = "/authorization/202309/shops";
  const ts = String(timestamp());
  const query: Record<string, string> = {
    app_key: appKey,
    timestamp: ts,
  };
  const sign = signTikTokRequest(appSecret, appKey, Number(ts), path, query);
  query.sign = sign;

  const res = await fetch(
    `${API_HOST}${path}?${new URLSearchParams(query).toString()}`,
    {
      headers: {
        "Content-Type": "application/json",
        "x-tts-access-token": accessToken,
      },
    }
  );
  const json = (await res.json()) as TikTokResponse<{
    shops?: Array<{ id: string; cipher: string; name: string }>;
  }>;
  if (json.code !== 0) {
    throw new Error(json.message || "Falha ao listar lojas TikTok");
  }
  return json.data?.shops ?? [];
}

async function refreshTikTokToken(): Promise<string> {
  const row = await getChannelSettings("tiktok");
  const creds = getResolvedCredentials(row);
  if (!creds.refreshToken) throw new Error("TikTok Shop não conectado");

  const res = await fetch(`${AUTH_HOST}/api/v2/token/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_key: creds.appKey,
      app_secret: creds.appSecret,
      refresh_token: creds.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const json = (await res.json()) as {
    code?: number;
    message?: string;
    data?: {
      access_token: string;
      refresh_token: string;
      access_token_expire_in: number;
      refresh_token_expire_in: number;
    };
  };

  if ((json.code !== undefined && json.code !== 0) || !json.data?.access_token) {
    throw new Error(json.message || "Falha ao renovar token TikTok");
  }

  await saveChannelTokens("tiktok", {
    accessToken: json.data.access_token,
    refreshToken: json.data.refresh_token,
    expiresIn: json.data.access_token_expire_in ?? 604800,
    refreshExpiresIn: json.data.refresh_token_expire_in,
    shopId: creds.shopId,
    shopCipher: creds.shopCipher,
  });

  return json.data.access_token;
}

export async function ensureTikTokAccessToken(): Promise<string> {
  const row = await getChannelSettings("tiktok");
  const creds = getResolvedCredentials(row);
  if (!creds.accessToken || !creds.shopId) {
    throw new Error("Conecte a loja TikTok Shop em Integrações");
  }
  const skewMs = 10 * 60 * 1000;
  if (creds.tokenExpiresAt && creds.tokenExpiresAt - Date.now() > skewMs) {
    return creds.accessToken;
  }
  return refreshTikTokToken();
}

export async function tiktokSearchProducts(pageToken = "", pageSize = 20) {
  return tiktokFetch<{
    products?: Array<{
      id: string;
      title: string;
      status: string;
      skus?: Array<{
        id: string;
        seller_sku?: string;
        price?: { sale_price?: string };
        inventory?: Array<{ quantity?: number; warehouse_id?: string }>;
      }>;
      main_images?: Array<{ urls?: string[] }>;
    }>;
    next_page_token?: string;
    total_count?: number;
  }>("/product/202309/products/search", {
    method: "POST",
    query: { page_size: String(pageSize), ...(pageToken ? { page_token: pageToken } : {}) },
    body: { status: "ACTIVATE" },
  });
}

export async function tiktokGetProduct(productId: string) {
  return tiktokFetch<{
    id: string;
    title: string;
    description?: string;
    category_id?: string;
    status?: string;
    skus?: Array<{
      id: string;
      seller_sku?: string;
      price?: { sale_price?: string; tax_exclusive_price?: string };
      inventory?: Array<{ quantity?: number; warehouse_id?: string }>;
      sales_attributes?: Array<{ name: string; value_name: string }>;
    }>;
    main_images?: Array<{ urls?: string[]; uri?: string }>;
    package_weight?: { value?: string; unit?: string };
    package_dimensions?: {
      length?: string;
      width?: string;
      height?: string;
      unit?: string;
    };
  }>(`/product/202309/products/${productId}`, {});
}

export async function tiktokGetCategories() {
  return tiktokFetch<{
    categories?: Array<{
      id: string;
      parent_id?: string;
      local_name?: string;
      is_leaf?: boolean;
    }>;
  }>("/product/202309/categories", {
    query: { locale: "pt-BR" },
  });
}

export async function tiktokGetWarehouses() {
  return tiktokFetch<{
    warehouses?: Array<{ id: string; name: string; is_default?: boolean }>;
  }>("/logistics/202309/warehouses", {});
}

export async function tiktokCreateProduct(body: Record<string, unknown>) {
  return tiktokFetch<{ product_id?: string; id?: string }>(
    "/product/202309/products",
    { method: "POST", body }
  );
}

export async function tiktokUpdateInventory(
  productId: string,
  skus: Array<{
    id: string;
    inventory: Array<{ warehouse_id: string; quantity: number }>;
  }>
) {
  return tiktokFetch(`/product/202309/products/${productId}/inventory/update`, {
    method: "POST",
    body: { skus },
  });
}

export async function tiktokUpdatePrice(
  productId: string,
  skus: Array<{ id: string; price: { amount: string; currency: string } }>
) {
  return tiktokFetch(`/product/202309/products/${productId}/prices/update`, {
    method: "POST",
    body: { skus },
  });
}

export async function tiktokGetOrderDetail(orderIds: string[]) {
  return tiktokFetch<{
    orders?: Array<{
      id: string;
      status: string;
      line_items?: Array<{
        sku_id?: string;
        seller_sku?: string;
        sku_name?: string;
        quantity?: number;
      }>;
    }>;
  }>("/order/202309/orders", {
    method: "POST",
    query: {},
    body: { ids: orderIds },
  });
}

export function verifyTikTokWebhookSign(
  appKey: string,
  appSecret: string,
  rawBody: string,
  authorization: string | null
): boolean {
  if (!authorization) return false;
  const expected = createHmac("sha256", appSecret)
    .update(appKey + rawBody)
    .digest("hex");
  return expected === authorization;
}
