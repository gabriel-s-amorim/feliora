import { NextResponse } from "next/server";
import type { BrevoWebhookEvent } from "@/shared/types/brevo";
import { getBrevoWebhookToken } from "@/lib/brevo/service";
import {
  bearerToken,
  brevoEventKey,
  tokensMatch,
} from "@/lib/brevo/webhookSecurity";
import { createAdminClient } from "@/lib/supabase/admin";

function eventAt(event: BrevoWebhookEvent): string {
  if (event.ts_epoch) return new Date(Number(event.ts_epoch)).toISOString();
  if (event.ts_event) return new Date(Number(event.ts_event) * 1000).toISOString();
  if (event.ts) return new Date(Number(event.ts) * 1000).toISOString();
  if (event.date) {
    const parsed = new Date(event.date);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return new Date().toISOString();
}

async function applyDeliveryStatus(event: BrevoWebhookEvent) {
  const messageId = String(event["message-id"] ?? event.messageId ?? "");
  if (!messageId) return;

  const type = String(event.event ?? "").toLowerCase();
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (type === "delivered") patch.delivered_at = eventAt(event);
  if (type === "opened" || type === "unique_opened") {
    patch.opened_at = eventAt(event);
  }
  if (type === "click" || type === "unique_click") {
    patch.clicked_at = eventAt(event);
  }
  if (
    ["softbounce", "hardbounce", "invalid", "blocked", "error", "spam"].includes(
      type
    )
  ) {
    patch.status = "failed";
    patch.failed_at = eventAt(event);
    patch.error_message = type;
  } else if (type === "delivered") {
    patch.status = "delivered";
  } else if (type === "sent") {
    patch.status = "sent";
  }

  const email = event.email?.trim().toLowerCase();
  let query = createAdminClient()
    .from("brevo_email_deliveries")
    .update(patch)
    .eq("message_id", messageId);
  if (email) query = query.eq("recipient_email", email);
  await query;
}

export async function POST(request: Request) {
  try {
    const expected = await getBrevoWebhookToken();
    const candidate = bearerToken(request.headers.get("authorization") ?? undefined);
    if (!candidate || !tokensMatch(candidate, expected)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = (await request.json()) as BrevoWebhookEvent | BrevoWebhookEvent[];
    const events = Array.isArray(body) ? body : [body];
    const supabase = createAdminClient();

    for (const event of events) {
      const key = brevoEventKey(event);
      const { error } = await supabase.from("brevo_email_events").upsert(
        {
          event_key: key,
          event_type: String(event.event ?? "unknown"),
          message_id: String(event["message-id"] ?? event.messageId ?? "") || null,
          campaign_id:
            event.campaignId != null
              ? Number(event.campaignId)
              : event.camp_id != null
                ? Number(event.camp_id)
                : null,
          email: event.email?.trim().toLowerCase() || null,
          event_at: eventAt(event),
          payload: event,
        },
        { onConflict: "event_key", ignoreDuplicates: true }
      );
      if (error) throw new Error(error.message);
      await applyDeliveryStatus(event);

      const type = String(event.event ?? "").toLowerCase();
      if (
        (type === "unsubscribe" || type === "unsubscribed") &&
        event.email
      ) {
        await supabase
          .from("marketing_subscriptions")
          .update({
            status: "unsubscribed",
            unsubscribed_at: eventAt(event),
            updated_at: new Date().toISOString(),
          })
          .ilike("email", event.email.trim());
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erro no webhook Brevo:", error);
    return NextResponse.json(
      { error: "Falha ao processar notificação" },
      { status: 500 }
    );
  }
}
