import type { PaymentStatus } from "@/shared/types/mercadoPago";
import type { OrderEmailEvent, StoreEmailEvent } from "@/shared/types/brevo";
import { SITE_NAME } from "@/shared/const/site";
import {
  buildItemsHtml,
  renderStoreEmailTemplate,
  wrapFelioraEmail,
  type OrderEmailParams,
} from "@/lib/brevo/storeEmailTemplate";
import {
  getBrevoTransactionalConfig,
  getPublicAppUrl,
  getStoreEmailTemplate,
  sendBrevoTransactionalEmail,
} from "@/lib/brevo/service";
import { createAdminClient } from "@/lib/supabase/admin";

const STORE_EVENTS = new Set<OrderEmailEvent>([
  "order_received",
  "order_received_merchant",
  "payment_approved",
]);

function money(value: unknown): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value ?? 0));
}

function paymentMethodLabel(value: string | null): string {
  if (value === "pix") return "Pix";
  if (value === "boleto") return "Boleto";
  if (value === "credit_card") return "Cartão de crédito";
  return value ?? "";
}

export function sampleOrderEmailParams() {
  const shortId = "TESTE001";
  return {
    ORDER_ID: "00000000-0000-0000-0000-000000000001",
    ORDER_SHORT_ID: shortId,
    CUSTOMER_NAME: "Cliente Teste",
    ORDER_URL: `${getPublicAppUrl()}/conta`,
    TOTAL: money(189.9),
    SUBTOTAL: money(159.9),
    SHIPPING_AMOUNT: money(30),
    PAYMENT_METHOD: "Pix",
    PAYMENT_STATUS: "pending",
    ITEMS: [
      {
        name: "Produto de teste",
        quantity: 1,
        price: money(159.9),
        size: "M",
        color: "Rose",
      },
    ],
    SHIPPING_COMPANY: "Correios",
    DELIVERY_DAYS: "5",
    TRACKING_CODE: "BR123456789BR",
    TRACKING_URL: "https://example.com/rastreio",
    ADDRESS: "Rua Exemplo, 100, Centro, São Paulo, SP, 01000-000",
  };
}

async function loadOrderEmailContext(orderId: string) {
  const supabase = createAdminClient();
  const [{ data: order, error: orderError }, { data: items, error: itemsError }] =
    await Promise.all([
      supabase.from("orders").select("*").eq("id", orderId).maybeSingle(),
      supabase
        .from("order_items")
        .select("product_name, quantity, price, size_label, color_name")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true }),
    ]);
  if (orderError || itemsError || !order) return null;

  const recipient = (order.shipping_recipient ?? {}) as {
    name?: string;
    email?: string;
  };
  let email = recipient.email?.trim().toLowerCase() ?? "";
  let customerName = recipient.name?.trim() ?? "";
  if ((!email || !customerName) && order.customer_id) {
    const [{ data: profile }, authResult] = await Promise.all([
      supabase
        .from("customer_profiles")
        .select("full_name")
        .eq("id", order.customer_id)
        .maybeSingle(),
      supabase.auth.admin.getUserById(order.customer_id),
    ]);
    email ||= authResult.data.user?.email?.toLowerCase() ?? "";
    customerName ||= profile?.full_name ?? "";
  }

  const address = (order.shipping_address ?? {}) as Record<string, string>;
  const itemParams = (items ?? []).map((item) => ({
    name: item.product_name,
    quantity: Number(item.quantity),
    price: money(item.price),
    size: item.size_label,
    color: item.color_name,
  }));
  const shortId = String(order.id).slice(0, 8).toUpperCase();
  const subtotal =
    Number(order.total_amount) -
    Number(order.shipping_amount) +
    Number(order.discount_amount ?? 0);
  const params = {
    ORDER_ID: order.id,
    ORDER_SHORT_ID: shortId,
    CUSTOMER_NAME: customerName || `Cliente ${SITE_NAME}`,
    ORDER_URL: `${getPublicAppUrl()}/conta`,
    TOTAL: money(order.total_amount),
    SUBTOTAL: money(subtotal),
    SHIPPING_AMOUNT: money(order.shipping_amount),
    PAYMENT_METHOD: paymentMethodLabel(order.payment_method),
    PAYMENT_STATUS: order.payment_status,
    ITEMS: itemParams,
    SHIPPING_COMPANY: order.shipping_company ?? "",
    DELIVERY_DAYS: order.shipping_delivery_days ?? "",
    TRACKING_CODE: order.tracking_code ?? "",
    TRACKING_URL: order.tracking_url ?? "",
    ADDRESS: [
      address.rua,
      address.numero,
      address.complemento,
      address.bairro,
      address.cidade,
      address.estado,
      address.cep,
    ]
      .filter(Boolean)
      .join(", "),
  };

  return { order, email, customerName, params };
}

async function resolveEmailContent(
  event: OrderEmailEvent,
  params: Record<string, unknown>,
  brevoTemplateId: number | null | undefined
): Promise<
  | { mode: "html"; subject: string; htmlContent: string }
  | { mode: "brevo"; templateId: number }
  | null
> {
  if (STORE_EVENTS.has(event)) {
    const store = await getStoreEmailTemplate(event as StoreEmailEvent);
    if (store?.enabled && store.htmlContent.trim()) {
      return {
        mode: "html",
        subject: renderStoreEmailTemplate(store.subject, params),
        htmlContent: renderStoreEmailTemplate(store.htmlContent, params),
      };
    }
  }
  if (brevoTemplateId) {
    return { mode: "brevo", templateId: brevoTemplateId };
  }

  // Fallback HTML para eventos de fulfillment sem template Brevo
  if (
    event === "order_processing" ||
    event === "order_shipped" ||
    event === "order_delivered"
  ) {
    const titles: Record<string, string> = {
      order_processing: "Em preparação",
      order_shipped: "Pedido enviado",
      order_delivered: "Pedido entregue",
    };
    const eyebrows: Record<string, string> = {
      order_processing: "Atualização do pedido",
      order_shipped: "Rastreio",
      order_delivered: "Entrega",
    };
    const intros: Record<string, string> = {
      order_processing:
        "Seu pedido está sendo preparado com cuidado pela nossa equipe.",
      order_shipped: params.TRACKING_CODE
        ? `Seu pedido saiu para entrega. Código de rastreio: <strong style="color:#2C241B;">${String(params.TRACKING_CODE)}</strong>.`
        : "Seu pedido saiu para entrega.",
      order_delivered:
        "Seu pedido foi marcado como entregue. Esperamos que ame cada detalhe.",
    };
    const trackingLink =
      event === "order_shipped" && params.TRACKING_URL
        ? `<p style="margin:14px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;"><a href="${String(params.TRACKING_URL)}" style="color:#B76E79;text-decoration:underline;">Acompanhar rastreio</a></p>`
        : "";
    const itemsTable = `<p style="margin:28px 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#B76E79;">Peças</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(183,110,121,0.18);">
  ${buildItemsHtml(params.ITEMS as OrderEmailParams["ITEMS"])}
</table>`;

    return {
      mode: "html",
      subject: `${titles[event]} — #${String(params.ORDER_SHORT_ID)}`,
      htmlContent: wrapFelioraEmail({
        eyebrow: eyebrows[event],
        title: titles[event],
        bodyHtml: `<p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.6;color:#6B5E52;">Olá, ${String(params.CUSTOMER_NAME)}!</p>
<p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.6;color:#6B5E52;">Pedido <strong style="color:#2C241B;">#${String(params.ORDER_SHORT_ID)}</strong>. ${intros[event]}</p>
${trackingLink}
${itemsTable}`,
        ctaLabel: "Ver pedido",
        ctaUrl: String(params.ORDER_URL ?? ""),
      }),
    };
  }

  return null;
}

export async function dispatchOrderEmail(
  orderId: string,
  event: OrderEmailEvent
): Promise<"sent" | "duplicate" | "skipped" | "failed"> {
  let config: Awaited<ReturnType<typeof getBrevoTransactionalConfig>>;
  try {
    config = await getBrevoTransactionalConfig();
  } catch {
    return "skipped";
  }

  const context = await loadOrderEmailContext(orderId);
  if (!context) return "failed";

  const resolved = await resolveEmailContent(
    event,
    context.params,
    config.templates[event as keyof typeof config.templates]
  );
  if (!resolved) return "skipped";

  const isMerchant = event === "order_received_merchant";
  const email = isMerchant
    ? config.merchantNotifyEmail.trim().toLowerCase()
    : context.email;
  const recipientName = isMerchant
    ? `Loja ${SITE_NAME}`
    : context.customerName || undefined;
  if (!email) return "skipped";

  const supabase = createAdminClient();
  const idempotencyKey = `${orderId}:${event}`;
  const { data: insertedDelivery, error: deliveryError } = await supabase
    .from("brevo_email_deliveries")
    .upsert(
      {
        order_id: orderId,
        event,
        idempotency_key: idempotencyKey,
        kind: "transactional",
        recipient_email: email,
        template_id: resolved.mode === "brevo" ? resolved.templateId : null,
        subject: resolved.mode === "html" ? resolved.subject : null,
        status: "queued",
        metadata: { orderId, event, mode: resolved.mode },
      },
      { onConflict: "idempotency_key", ignoreDuplicates: true }
    )
    .select("id, attempt_count")
    .maybeSingle();
  if (deliveryError) {
    console.error("Brevo delivery upsert:", deliveryError.message);
    return "failed";
  }

  let delivery = insertedDelivery;
  if (!delivery) {
    const { data: failedDelivery } = await supabase
      .from("brevo_email_deliveries")
      .select("id, attempt_count")
      .eq("idempotency_key", idempotencyKey)
      .eq("status", "failed")
      .lt("attempt_count", 3)
      .maybeSingle();
    if (!failedDelivery) return "duplicate";
    const { data: claimed } = await supabase
      .from("brevo_email_deliveries")
      .update({
        status: "sending",
        error_message: null,
        attempt_count: Number(failedDelivery.attempt_count) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", failedDelivery.id)
      .eq("status", "failed")
      .select("id, attempt_count")
      .maybeSingle();
    if (!claimed) return "duplicate";
    delivery = claimed;
  } else {
    await supabase
      .from("brevo_email_deliveries")
      .update({
        status: "sending",
        attempt_count: 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", delivery.id);
  }

  try {
    const payload =
      resolved.mode === "html"
        ? {
            to: [{ email, name: recipientName }],
            replyTo: config.replyTo ? { email: config.replyTo } : undefined,
            subject: resolved.subject,
            htmlContent: resolved.htmlContent,
            tags: ["order", event],
          }
        : {
            to: [{ email, name: recipientName }],
            replyTo: config.replyTo ? { email: config.replyTo } : undefined,
            templateId: resolved.templateId,
            params: context.params,
            tags: ["order", event],
          };
    const result = await sendBrevoTransactionalEmail(payload, "transactional", {
      record: false,
    });
    await supabase
      .from("brevo_email_deliveries")
      .update({
        message_id: result.messageId ?? null,
        status: "sent",
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", delivery.id);
    return "sent";
  } catch (error) {
    await supabase
      .from("brevo_email_deliveries")
      .update({
        status: "failed",
        failed_at: new Date().toISOString(),
        error_message:
          error instanceof Error
            ? error.message.slice(0, 2000)
            : "Erro desconhecido",
        updated_at: new Date().toISOString(),
      })
      .eq("id", delivery.id);
    console.error("Brevo send failed:", error);
    return "failed";
  }
}

export async function dispatchOrderCreatedEmails(orderId: string) {
  const customer = await dispatchOrderEmail(orderId, "order_received");
  const merchant = await dispatchOrderEmail(orderId, "order_received_merchant");
  return { customer, merchant };
}

export async function dispatchPaymentStatusEmail(
  orderId: string,
  status: PaymentStatus
) {
  if (status === "approved") {
    return dispatchOrderEmail(orderId, "payment_approved");
  }
  if (status === "refunded") {
    return dispatchOrderEmail(orderId, "payment_refunded");
  }
  if (["rejected", "canceled", "expired"].includes(status)) {
    return dispatchOrderEmail(orderId, "payment_failed");
  }
  return "skipped" as const;
}

export async function sendOrderTemplateTest(input: {
  event: StoreEmailEvent;
  email: string;
}) {
  const config = await getBrevoTransactionalConfig();
  const store = await getStoreEmailTemplate(input.event);
  if (!store?.enabled || !store.htmlContent.trim()) {
    throw new Error("Edite e salve este e-mail no admin antes de testar");
  }
  const email = input.email.trim().toLowerCase();
  const params = {
    ...sampleOrderEmailParams(),
    ...(input.event === "payment_approved"
      ? { PAYMENT_STATUS: "approved" }
      : {}),
  };
  return sendBrevoTransactionalEmail(
    {
      to: [
        {
          email,
          name:
            input.event === "order_received_merchant"
              ? `Loja ${SITE_NAME}`
              : "Cliente Teste",
        },
      ],
      replyTo: config.replyTo ? { email: config.replyTo } : undefined,
      subject: renderStoreEmailTemplate(store.subject, params),
      htmlContent: renderStoreEmailTemplate(store.htmlContent, params),
      tags: ["order", "test", input.event],
    },
    "test"
  );
}
