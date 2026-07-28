export type BrevoDeliveryKind = "transactional" | "campaign" | "test";

export type StoreEmailEvent =
  | "order_received"
  | "order_received_merchant"
  | "payment_approved";

export type OrderEmailEvent =
  | StoreEmailEvent
  | "payment_failed"
  | "payment_refunded"
  | "order_processing"
  | "order_shipped"
  | "order_delivered";

export interface BrevoSettingsInput {
  enabled: boolean;
  apiKey?: string;
  webhookToken?: string;
  defaultSenderId?: number | null;
  defaultSenderEmail?: string;
  defaultSenderName?: string;
  replyTo?: string;
  merchantNotifyEmail?: string;
  defaultListId?: number | null;
  templateOrderReceived?: number | null;
  templateOrderReceivedMerchant?: number | null;
  templatePaymentApproved?: number | null;
  templatePaymentFailed?: number | null;
  templatePaymentRefunded?: number | null;
  templateOrderProcessing?: number | null;
  templateOrderShipped?: number | null;
  templateOrderDelivered?: number | null;
}

export interface BrevoAdminStatus
  extends Omit<BrevoSettingsInput, "apiKey" | "webhookToken"> {
  hasApiKey: boolean;
  hasWebhookToken: boolean;
  configured: boolean;
  connected: boolean;
  accountEmail: string | null;
  webhookConfigured: boolean;
  lastTestedAt: string | null;
  webhookUrl: string;
}

export interface BrevoRecipient {
  email: string;
  name?: string;
}

export interface BrevoTransactionalEmailInput {
  to: BrevoRecipient[];
  sender?: BrevoRecipient;
  replyTo?: BrevoRecipient;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  templateId?: number;
  params?: Record<string, unknown>;
  tags?: string[];
  sandbox?: boolean;
}

export interface StoreEmailTemplate {
  event: StoreEmailEvent;
  name: string;
  subject: string;
  htmlContent: string;
  enabled: boolean;
  updatedAt: string;
}

export interface BrevoWebhookEvent {
  event?: string;
  email?: string;
  id?: number | string;
  date?: string;
  ts?: number;
  ts_event?: number;
  ts_epoch?: number;
  "message-id"?: string;
  messageId?: string;
  campaignId?: number;
  camp_id?: number;
  [key: string]: unknown;
}

export interface NewsletterSubscribeInput {
  email: string;
  consent: true;
  name?: string;
  source?: string;
  website?: string;
}
