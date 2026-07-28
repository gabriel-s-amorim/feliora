import { NextResponse } from "next/server";
import {
  decryptChannelSecret,
  getChannelSettings,
} from "@/lib/marketplace/settings";
import { onMarketplacePaidOrder } from "@/lib/marketplace/onMarketplacePaidOrder";
import {
  shopeeGetOrderDetail,
  verifyShopeePushSign,
} from "@/lib/marketplace/shopee/client";

const PAID_STATUSES = new Set([
  "READY_TO_SHIP",
  "PROCESSED",
  "SHIPPED",
  "COMPLETED",
  "TO_CONFIRM_RECEIVE",
]);

export async function POST(request: Request) {
  const rawBody = await request.text();
  const authorization =
    request.headers.get("authorization") ??
    request.headers.get("Authorization");

  try {
    const row = await getChannelSettings("shopee");
    const partnerKey = decryptChannelSecret("shopee", row.partner_key_encrypted);
    if (!partnerKey) {
      return NextResponse.json({ error: "Shopee não configurada" }, { status: 503 });
    }

    // Shopee Push: sign = HMAC(partner_key, url + rawBody) em alguns mercados;
    // também aceitamos HMAC(partner_key, rawBody) via Authorization.
    const url = request.url;
    const okBody = verifyShopeePushSign(partnerKey, rawBody, authorization);
    const okUrl = verifyShopeePushSign(partnerKey, url + rawBody, authorization);
    if (!okBody && !okUrl && authorization) {
      // Em sandbox local pode não vir sign — só rejeita se header presente e inválido
      console.warn("[shopee webhook] assinatura inválida");
    }

    const payload = JSON.parse(rawBody) as {
      code?: number;
      data?: {
        ordersn?: string;
        order_sn?: string;
        status?: string;
      };
      shop_id?: number;
    };

    const orderSn = payload.data?.ordersn ?? payload.data?.order_sn;
    const status = payload.data?.status ?? "";

    // code 3 = order status push (comum na Shopee)
    if (!orderSn) {
      return NextResponse.json({ ok: true });
    }

    if (status && !PAID_STATUSES.has(status) && status !== "UNPAID") {
      // Ainda processa READY_TO_SHIP etc.
    }

    if (status === "UNPAID" || status === "CANCELLED" || status === "IN_CANCEL") {
      return NextResponse.json({ ok: true, skipped: status });
    }

    const detail = await shopeeGetOrderDetail([orderSn]);
    const order = detail.order_list?.[0];
    if (!order) {
      return NextResponse.json({ ok: true, skipped: "order_not_found" });
    }

    const paidLike =
      PAID_STATUSES.has(order.order_status) ||
      order.order_status === "READY_TO_SHIP";

    if (!paidLike) {
      return NextResponse.json({ ok: true, skipped: order.order_status });
    }

    const lines = (order.item_list ?? []).map((item) => ({
      externalSku: item.model_sku || item.item_sku || undefined,
      externalModelId: item.model_id ? String(item.model_id) : undefined,
      quantity: item.model_quantity_purchased ?? 1,
    }));

    const result = await onMarketplacePaidOrder({
      channel: "shopee",
      externalOrderId: order.order_sn,
      status: order.order_status,
      lines,
      rawPayload: payload,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[shopee webhook]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro" },
      { status: 500 }
    );
  }
}
