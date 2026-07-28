import type { NewsletterSubscribeSchemaInput } from "@/shared/schemas/brevo";
import {
  getBrevoAdminStatus,
  upsertBrevoContact,
} from "@/lib/brevo/service";
import { createAdminClient } from "@/lib/supabase/admin";

export async function subscribeNewsletter(
  input: NewsletterSubscribeSchemaInput,
  meta: { ip?: string | null; userAgent?: string | null }
) {
  if (input.website) {
    return { success: true as const, duplicate: false };
  }

  const email = input.email.trim().toLowerCase();
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("marketing_subscriptions")
    .select("id, status")
    .ilike("email", email)
    .maybeSingle();

  if (existing?.status === "subscribed") {
    return { success: true as const, duplicate: true };
  }

  const row = {
    email,
    name: input.name?.trim() || null,
    status: "subscribed",
    source: input.source?.trim() || "newsletter_form",
    consent_at: now,
    consent_source: input.source?.trim() || "newsletter_form",
    consent_ip: meta.ip || null,
    consent_user_agent: meta.userAgent?.slice(0, 500) || null,
    unsubscribed_at: null,
    sync_status: "pending",
    sync_error: null,
    updated_at: now,
  };

  if (existing) {
    const { error } = await supabase
      .from("marketing_subscriptions")
      .update(row)
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("marketing_subscriptions")
      .insert(row);
    if (error) throw new Error(error.message);
  }

  try {
    const status = await getBrevoAdminStatus();
    if (status.enabled && status.configured) {
      await upsertBrevoContact({
        email,
        firstName: input.name?.trim(),
      });
      await supabase
        .from("marketing_subscriptions")
        .update({
          sync_status: "synced",
          synced_at: now,
          sync_error: null,
          brevo_list_ids: status.defaultListId
            ? [status.defaultListId]
            : [],
          updated_at: now,
        })
        .ilike("email", email);
    }
  } catch (error) {
    await supabase
      .from("marketing_subscriptions")
      .update({
        sync_status: "failed",
        sync_error:
          error instanceof Error
            ? error.message.slice(0, 500)
            : "Falha ao sincronizar",
        updated_at: new Date().toISOString(),
      })
      .ilike("email", email);
  }

  return { success: true as const, duplicate: false };
}
