import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AdminNotification,
  AdminNotificationKind,
} from "@/shared/types/adminNotification";

type AdminNotificationRow = {
  id: string;
  kind: AdminNotificationKind;
  title: string;
  body: string;
  link_path: string | null;
  order_id: string | null;
  customer_id: string | null;
  read_at: string | null;
  created_at: string;
};

function isMissingRelationError(error: {
  code?: string;
  message?: string;
} | null): boolean {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  const message = error.message?.toLowerCase() ?? "";
  return (
    message.includes("does not exist") ||
    message.includes("could not find the table")
  );
}

function mapRow(row: AdminNotificationRow): AdminNotification {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    linkPath: row.link_path,
    orderId: row.order_id,
    customerId: row.customer_id,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export async function listAdminNotifications(): Promise<AdminNotification[]> {
  const { data, error } = await createAdminClient()
    .from("admin_notifications")
    .select(
      "id, kind, title, body, link_path, order_id, customer_id, read_at, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    if (isMissingRelationError(error)) return [];
    throw new Error(error.message);
  }

  return ((data ?? []) as AdminNotificationRow[]).map(mapRow);
}

export async function countUnreadAdminNotifications(): Promise<number> {
  const { count, error } = await createAdminClient()
    .from("admin_notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);

  if (error) {
    if (isMissingRelationError(error)) return 0;
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function markAdminNotificationRead(
  notificationId: string
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await createAdminClient()
    .from("admin_notifications")
    .update({ read_at: now })
    .eq("id", notificationId)
    .is("read_at", null);

  if (error) {
    if (isMissingRelationError(error)) {
      throw new Error(
        "Tabelas de notificações admin ainda não existem. Execute supabase/21_admin_notifications.sql"
      );
    }
    throw new Error(error.message);
  }
}

export async function markAdminNotificationsRead(
  notificationIds: string[]
): Promise<void> {
  if (!notificationIds.length) return;
  const now = new Date().toISOString();
  const { error } = await createAdminClient()
    .from("admin_notifications")
    .update({ read_at: now })
    .in("id", notificationIds)
    .is("read_at", null);

  if (error) {
    if (isMissingRelationError(error)) {
      throw new Error(
        "Tabelas de notificações admin ainda não existem. Execute supabase/21_admin_notifications.sql"
      );
    }
    throw new Error(error.message);
  }
}

export async function markAllAdminNotificationsRead(): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await createAdminClient()
    .from("admin_notifications")
    .update({ read_at: now })
    .is("read_at", null);

  if (error) {
    if (isMissingRelationError(error)) {
      throw new Error(
        "Tabelas de notificações admin ainda não existem. Execute supabase/21_admin_notifications.sql"
      );
    }
    throw new Error(error.message);
  }
}
