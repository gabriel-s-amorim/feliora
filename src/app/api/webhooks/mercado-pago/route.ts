import { NextResponse } from "next/server";
import type { MercadoPagoEnvironment } from "@/shared/types/mercadoPago";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getMercadoPagoOrder,
  mercadoPagoOrderIdentity,
  verifyMercadoPagoSignature,
} from "@/lib/mercadoPago/service";
import { ensurePaidOrderInMelhorEnvioCart } from "@/lib/melhorEnvio/service";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const dataParam = url.searchParams.get("data.id");
  const nestedData = url.searchParams.get("data");
  const signatureDataId = dataParam ?? nestedData ?? undefined;

  let body: { data?: { id?: string } } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const orderId = signatureDataId ?? String(body?.data?.id ?? "");
  const requestId = request.headers.get("x-request-id") ?? undefined;
  const signature = request.headers.get("x-signature") ?? undefined;

  try {
    const { data: attempt } = await createAdminClient()
      .from("payment_attempts")
      .select("environment")
      .eq("mercado_pago_order_id", orderId)
      .maybeSingle();
    const environment = attempt?.environment as
      | MercadoPagoEnvironment
      | undefined;
    const valid = await verifyMercadoPagoSignature({
      dataId: signatureDataId,
      requestId,
      signature,
      environment,
    });
    if (!valid) {
      return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
    }
    if (!attempt || !orderId) {
      return NextResponse.json({ received: true, ignored: true });
    }

    const payload = await getMercadoPagoOrder(orderId, environment);
    const identity = mercadoPagoOrderIdentity(payload);
    const { data: reconciledOrderId, error } = await createAdminClient().rpc(
      "reconcile_mercado_pago_payment",
      {
        p_mercado_pago_order_id: identity.orderId,
        p_mercado_pago_payment_id: identity.paymentId,
        p_payment_status: identity.status,
        p_status_detail: identity.statusDetail,
        p_response: payload,
      }
    );
    if (error) throw new Error(error.message);

    if (identity.status === "approved" && reconciledOrderId) {
      try {
        await ensurePaidOrderInMelhorEnvioCart(String(reconciledOrderId));
      } catch (shippingError) {
        console.error("Erro ao preparar etiqueta Melhor Envio:", shippingError);
      }
    }
    if (identity.instructions) {
      const { error: instructionsError } = await createAdminClient()
        .from("orders")
        .update({
          payment_instructions: identity.instructions,
          payment_expires_at: identity.instructions.expirationDate ?? null,
        })
        .eq("mercado_pago_order_id", identity.orderId);
      if (instructionsError) throw new Error(instructionsError.message);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erro no webhook Mercado Pago:", error);
    return NextResponse.json(
      { error: "Falha ao processar notificação" },
      { status: 500 }
    );
  }
}
