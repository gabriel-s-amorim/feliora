import { NextResponse } from "next/server";
import {
  getChannelSettings,
  getResolvedCredentials,
} from "@/lib/marketplace/settings";
import { onMarketplacePaidOrder } from "@/lib/marketplace/onMarketplacePaidOrder";
import {
  tiktokGetOrderDetail,
  verifyTikTokWebhookSign,
} from "@/lib/marketplace/tiktok/client";

const PAID_STATUSES = new Set([
  "AWAITING_SHIPMENT",
  "AWAITING_COLLECTION",
  "IN_TRANSIT",
  "DELIVERED",
  "COMPLETED",
  "PARTIALLY_SHIPPING",
]);

export async function POST(request: Request) {
  const rawBody = await request.text();
  const authorization = request.headers.get("authorization");

  try {
    const row = await getChannelSettings("tiktok");
    const creds = getResolvedCredentials(row);
    if (!creds.appKey || !creds.appSecret) {
      return NextResponse.json(
        { error: "TikTok não configurado" },
        { status: 503 }
      );
    }

    if (
      authorization &&
      !verifyTikTokWebhookSign(
        creds.appKey,
        creds.appSecret,
        rawBody,
        authorization
      )
    ) {
      return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as {
      type?: number;
      tts_notification_id?: string;
      data?: {
        order_id?: string;
        order_status?: string;
      };
    };

    // type 1 = ORDER_STATUS_CHANGE em várias versões da docs
    const orderId = payload.data?.order_id;
    const status = payload.data?.order_status ?? "";

    if (!orderId) {
      return NextResponse.json({ ok: true });
    }

    if (!PAID_STATUSES.has(status)) {
      return new NextResponse(null, { status: 200 });
    }

    const detail = await tiktokGetOrderDetail([orderId]);
    const order = detail.orders?.[0];
    if (!order) {
      return new NextResponse(null, { status: 200 });
    }

    const lines = (order.line_items ?? []).map((item) => ({
      externalSku: item.seller_sku || undefined,
      externalSkuId: item.sku_id || undefined,
      quantity: item.quantity ?? 1,
    }));

    await onMarketplacePaidOrder({
      channel: "tiktok",
      externalOrderId: order.id,
      status: order.status,
      lines,
      rawPayload: payload,
    });

    // TikTok exige 200 com body vazio em < 3s
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("[tiktok webhook]", error);
    // Ainda retorna 200 para evitar retry storm em erros de negócio;
    // erros de assinatura já retornaram 401.
    return new NextResponse(null, { status: 200 });
  }
}
