import type {
  BrevoAdminStatus,
  BrevoDeliveryKind,
  BrevoSettingsInput,
  BrevoTransactionalEmailInput,
  StoreEmailEvent,
  StoreEmailTemplate,
} from "@/shared/types/brevo";
import {
  decryptStoredSecret,
  encryptSecret,
} from "@/lib/crypto/secretCrypto";
import { createAdminClient } from "@/lib/supabase/admin";

const BREVO_API_URL = "https://api.brevo.com/v3";
const BREVO_KEY = "BREVO_ENCRYPTION_KEY" as const;

interface BrevoSettingsRow {
  id: boolean;
  enabled: boolean;
  api_key_encrypted: string | null;
  webhook_token_encrypted: string | null;
  default_sender_id: number | null;
  default_sender_email: string;
  default_sender_name: string;
  reply_to: string;
  merchant_notify_email: string;
  default_list_id: number | null;
  template_order_received: number | null;
  template_order_received_merchant: number | null;
  template_payment_approved: number | null;
  template_payment_failed: number | null;
  template_payment_refunded: number | null;
  template_order_processing: number | null;
  template_order_shipped: number | null;
  template_order_delivered: number | null;
  account_email: string | null;
  last_tested_at: string | null;
}

interface ActiveBrevoSettings extends BrevoSettingsRow {
  apiKey: string;
}

export class BrevoApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown
  ) {
    super(message);
    this.name = "BrevoApiError";
  }
}

export function getPublicAppUrl(): string {
  const raw =
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");
  const withProtocol = raw.startsWith("http") ? raw : `https://${raw}`;
  return withProtocol.replace(/\/$/, "");
}

export function getBrevoWebhookUrl(): string {
  return `${getPublicAppUrl()}/api/webhooks/brevo`;
}

async function getSettingsRow(): Promise<BrevoSettingsRow> {
  const { data, error } = await createAdminClient()
    .from("brevo_settings")
    .select("*")
    .eq("id", true)
    .single();
  if (error) throw new Error(error.message);
  return data as BrevoSettingsRow;
}

async function getActiveSettings(): Promise<ActiveBrevoSettings> {
  const row = await getSettingsRow();
  if (!row.enabled) throw new Error("Brevo não está habilitado");
  if (!row.api_key_encrypted) {
    throw new Error("Chave da API Brevo não configurada");
  }
  return {
    ...row,
    apiKey: decryptStoredSecret(row.api_key_encrypted, BREVO_KEY),
  };
}

function adminStatus(row: BrevoSettingsRow): BrevoAdminStatus {
  return {
    enabled: row.enabled,
    defaultSenderId: row.default_sender_id,
    defaultSenderEmail: row.default_sender_email,
    defaultSenderName: row.default_sender_name,
    replyTo: row.reply_to,
    merchantNotifyEmail: row.merchant_notify_email,
    defaultListId: row.default_list_id,
    templateOrderReceived: row.template_order_received,
    templateOrderReceivedMerchant: row.template_order_received_merchant,
    templatePaymentApproved: row.template_payment_approved,
    templatePaymentFailed: row.template_payment_failed,
    templatePaymentRefunded: row.template_payment_refunded,
    templateOrderProcessing: row.template_order_processing,
    templateOrderShipped: row.template_order_shipped,
    templateOrderDelivered: row.template_order_delivered,
    hasApiKey: Boolean(row.api_key_encrypted),
    hasWebhookToken: Boolean(row.webhook_token_encrypted),
    configured: Boolean(row.api_key_encrypted),
    connected: Boolean(row.api_key_encrypted && row.last_tested_at),
    accountEmail: row.account_email,
    webhookConfigured: Boolean(
      row.webhook_token_encrypted || process.env.BREVO_WEBHOOK_TOKEN?.trim()
    ),
    lastTestedAt: row.last_tested_at,
    webhookUrl: getBrevoWebhookUrl(),
  };
}

export async function getBrevoAdminStatus(): Promise<BrevoAdminStatus> {
  return adminStatus(await getSettingsRow());
}

export async function updateBrevoSettings(
  input: BrevoSettingsInput
): Promise<BrevoAdminStatus> {
  const update: Record<string, unknown> = {
    enabled: input.enabled,
    updated_at: new Date().toISOString(),
  };
  if (input.defaultSenderId !== undefined) {
    update.default_sender_id = input.defaultSenderId;
  }
  if (input.defaultSenderEmail !== undefined) {
    update.default_sender_email = input.defaultSenderEmail.trim().toLowerCase();
  }
  if (input.defaultSenderName !== undefined) {
    update.default_sender_name = input.defaultSenderName.trim();
  }
  if (input.replyTo !== undefined) {
    update.reply_to = input.replyTo.trim().toLowerCase();
  }
  if (input.merchantNotifyEmail !== undefined) {
    update.merchant_notify_email = input.merchantNotifyEmail
      .trim()
      .toLowerCase();
  }
  if (input.defaultListId !== undefined) {
    update.default_list_id = input.defaultListId;
  }

  const templateColumns = {
    templateOrderReceived: "template_order_received",
    templateOrderReceivedMerchant: "template_order_received_merchant",
    templatePaymentApproved: "template_payment_approved",
    templatePaymentFailed: "template_payment_failed",
    templatePaymentRefunded: "template_payment_refunded",
    templateOrderProcessing: "template_order_processing",
    templateOrderShipped: "template_order_shipped",
    templateOrderDelivered: "template_order_delivered",
  } as const;

  for (const [field, column] of Object.entries(templateColumns) as Array<
    [
      keyof typeof templateColumns,
      (typeof templateColumns)[keyof typeof templateColumns],
    ]
  >) {
    if (input[field] !== undefined) update[column] = input[field];
  }

  if (input.apiKey?.trim()) {
    update.api_key_encrypted = encryptSecret(input.apiKey.trim(), BREVO_KEY);
    update.account_email = null;
    update.last_tested_at = null;
  }
  if (input.webhookToken?.trim()) {
    update.webhook_token_encrypted = encryptSecret(
      input.webhookToken.trim(),
      BREVO_KEY
    );
  }

  const { data, error } = await createAdminClient()
    .from("brevo_settings")
    .update(update)
    .eq("id", true)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return adminStatus(data as BrevoSettingsRow);
}

export async function getBrevoWebhookToken(): Promise<string> {
  const environmentToken = process.env.BREVO_WEBHOOK_TOKEN?.trim();
  if (environmentToken) return environmentToken;
  const row = await getSettingsRow();
  if (!row.webhook_token_encrypted) {
    throw new Error("Token do webhook Brevo não configurado");
  }
  return decryptStoredSecret(row.webhook_token_encrypted, BREVO_KEY);
}

export async function getBrevoTransactionalConfig() {
  const settings = await getActiveSettings();
  return {
    enabled: settings.enabled,
    replyTo: settings.reply_to,
    merchantNotifyEmail: settings.merchant_notify_email,
    templates: {
      order_received: settings.template_order_received,
      order_received_merchant: settings.template_order_received_merchant,
      payment_approved: settings.template_payment_approved,
      payment_failed: settings.template_payment_failed,
      payment_refunded: settings.template_payment_refunded,
      order_processing: settings.template_order_processing,
      order_shipped: settings.template_order_shipped,
      order_delivered: settings.template_order_delivered,
    },
  };
}

export async function brevoRequest<T>(
  path: string,
  options: RequestInit = {},
  apiKey?: string
): Promise<T> {
  const key = apiKey ?? (await getActiveSettings()).apiKey;
  const response = await fetch(`${BREVO_API_URL}${path}`, {
    ...options,
    headers: {
      accept: "application/json",
      "api-key": key,
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...(options.headers ?? {}),
    },
  });
  const raw = await response.text();
  let body: Record<string, unknown> = {};
  try {
    body = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    body = { message: raw };
  }
  if (!response.ok) {
    throw new BrevoApiError(
      String(
        body?.message ?? body?.error ?? `Brevo respondeu HTTP ${response.status}`
      ),
      response.status,
      body
    );
  }
  return body as T;
}

export async function testBrevoCredentials(): Promise<{
  success: true;
  accountEmail: string | null;
}> {
  const account = await brevoRequest<{ email?: string }>("/account");
  const testedAt = new Date().toISOString();
  await createAdminClient()
    .from("brevo_settings")
    .update({
      account_email: account.email ?? null,
      last_tested_at: testedAt,
      updated_at: testedAt,
    })
    .eq("id", true);
  return { success: true, accountEmail: account.email ?? null };
}

export async function configureBrevoWebhooks() {
  const token = await getBrevoWebhookToken();
  const url = getBrevoWebhookUrl();
  const definition = {
    type: "transactional",
    events: [
      "sent",
      "delivered",
      "opened",
      "click",
      "softBounce",
      "hardBounce",
      "invalid",
      "blocked",
      "error",
      "spam",
      "unsubscribed",
    ],
  };

  const existing = await brevoRequest<{
    webhooks?: Array<{ id: number; url: string; type?: string }>;
  }>(`/webhooks?type=${definition.type}&sort=desc`);

  const match = existing.webhooks?.find(
    (webhook) =>
      webhook.url === url &&
      Number.isFinite(webhook.id) &&
      webhook.id > 0 &&
      (webhook.type == null || webhook.type === definition.type)
  );

  const body = {
    description: "Feliora (transactional)",
    url,
    events: definition.events,
    type: definition.type,
    auth: { type: "bearer" as const, token },
  };

  if (match) {
    await brevoRequest(`/webhooks/${match.id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  } else {
    await brevoRequest("/webhooks", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  return { success: true as const, webhookUrl: url };
}

export async function sendBrevoTransactionalEmail(
  input: BrevoTransactionalEmailInput,
  kind: BrevoDeliveryKind = "transactional",
  options: { record?: boolean } = {}
) {
  const settings = await getActiveSettings();
  let sender = input.sender;
  if (!sender && settings.default_sender_email) {
    sender = {
      email: settings.default_sender_email,
      name: settings.default_sender_name || undefined,
    };
  }
  if (!sender?.email) {
    throw new Error("Remetente padrão não configurado no Brevo");
  }

  const payload = {
    to: input.to,
    sender,
    replyTo:
      input.replyTo ??
      (settings.reply_to ? { email: settings.reply_to } : undefined),
    subject: input.subject,
    htmlContent: input.htmlContent,
    textContent: input.textContent,
    templateId: input.templateId,
    params: input.params,
    tags: input.tags,
  };

  const result = await brevoRequest<{ messageId?: string }>(
    "/smtp/email",
    {
      method: "POST",
      headers: input.sandbox ? { "X-Sib-Sandbox": "drop" } : undefined,
      body: JSON.stringify(payload),
    },
    settings.apiKey
  );

  const messageId = result.messageId ?? null;
  if (options.record !== false) {
    const rows = input.to.map((recipient) => ({
      kind,
      message_id: messageId,
      recipient_email: recipient.email.toLowerCase(),
      template_id: input.templateId ?? null,
      subject: input.subject ?? null,
      status: input.sandbox ? "sandboxed" : "sent",
      sent_at: new Date().toISOString(),
      metadata: { tags: input.tags ?? [] },
    }));
    await createAdminClient().from("brevo_email_deliveries").insert(rows);
  }

  return { messageId };
}

export async function upsertBrevoContact(input: {
  email: string;
  firstName?: string;
  listIds?: number[];
}) {
  const settings = await getActiveSettings();
  const listIds =
    input.listIds ??
    (settings.default_list_id ? [settings.default_list_id] : undefined);

  try {
    await brevoRequest(
      `/contacts/${encodeURIComponent(input.email.toLowerCase())}`,
      {
        method: "PUT",
        body: JSON.stringify({
          attributes: input.firstName
            ? { FIRSTNAME: input.firstName }
            : undefined,
          listIds,
          emailBlacklisted: false,
        }),
      },
      settings.apiKey
    );
  } catch (error) {
    if (!(error instanceof BrevoApiError) || error.status !== 404) throw error;
    await brevoRequest(
      "/contacts",
      {
        method: "POST",
        body: JSON.stringify({
          email: input.email.toLowerCase(),
          attributes: input.firstName
            ? { FIRSTNAME: input.firstName }
            : undefined,
          listIds,
          updateEnabled: true,
        }),
      },
      settings.apiKey
    );
  }
}

export async function listStoreEmailTemplates(): Promise<StoreEmailTemplate[]> {
  const { data, error } = await createAdminClient()
    .from("brevo_store_templates")
    .select("*")
    .order("event", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    event: row.event as StoreEmailEvent,
    name: row.name,
    subject: row.subject,
    htmlContent: row.html_content,
    enabled: Boolean(row.enabled),
    updatedAt: row.updated_at,
  }));
}

export async function getStoreEmailTemplate(
  event: StoreEmailEvent
): Promise<StoreEmailTemplate | null> {
  const { data, error } = await createAdminClient()
    .from("brevo_store_templates")
    .select("*")
    .eq("event", event)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    event: data.event as StoreEmailEvent,
    name: data.name,
    subject: data.subject,
    htmlContent: data.html_content,
    enabled: Boolean(data.enabled),
    updatedAt: data.updated_at,
  };
}

export async function updateStoreEmailTemplate(input: {
  event: StoreEmailEvent;
  name?: string;
  subject: string;
  htmlContent: string;
  enabled?: boolean;
}): Promise<StoreEmailTemplate> {
  const update: Record<string, unknown> = {
    subject: input.subject,
    html_content: input.htmlContent,
    updated_at: new Date().toISOString(),
  };
  if (input.name !== undefined) update.name = input.name;
  if (input.enabled !== undefined) update.enabled = input.enabled;

  const { data, error } = await createAdminClient()
    .from("brevo_store_templates")
    .update(update)
    .eq("event", input.event)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return {
    event: data.event as StoreEmailEvent,
    name: data.name,
    subject: data.subject,
    htmlContent: data.html_content,
    enabled: Boolean(data.enabled),
    updatedAt: data.updated_at,
  };
}
