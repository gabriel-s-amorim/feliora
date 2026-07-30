import { createAdminClient } from "@/lib/supabase/admin";
import type {
  OrderMessage,
  OrderMessageSenderRole,
  OrderNotification,
  OrderNotificationKind,
} from "@/shared/types/orderCommunication";

type NotificationRow = {
  id: string;
  order_id: string;
  customer_id: string;
  kind: OrderNotificationKind;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

type MessageRow = {
  id: string;
  order_id: string;
  customer_id: string;
  sender_role: OrderMessageSenderRole;
  body: string;
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

function mapNotification(row: NotificationRow): OrderNotification {
  return {
    id: row.id,
    orderId: row.order_id,
    customerId: row.customer_id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

function mapMessage(row: MessageRow): OrderMessage {
  return {
    id: row.id,
    orderId: row.order_id,
    customerId: row.customer_id,
    senderRole: row.sender_role,
    body: row.body,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

async function assertCustomerOwnsOrder(
  customerId: string,
  orderId: string
): Promise<{ id: string; customer_id: string }> {
  const { data, error } = await createAdminClient()
    .from("orders")
    .select("id, customer_id")
    .eq("id", orderId)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Pedido não encontrado");
  return data as { id: string; customer_id: string };
}

async function assertOrderExists(
  orderId: string
): Promise<{ id: string; customer_id: string | null }> {
  const { data, error } = await createAdminClient()
    .from("orders")
    .select("id, customer_id")
    .eq("id", orderId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Pedido não encontrado");
  return data as { id: string; customer_id: string | null };
}

export async function listCustomerNotifications(
  customerId: string
): Promise<OrderNotification[]> {
  const { data, error } = await createAdminClient()
    .from("order_notifications")
    .select(
      "id, order_id, customer_id, kind, title, body, read_at, created_at"
    )
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    if (isMissingRelationError(error)) return [];
    throw new Error(error.message);
  }

  return ((data ?? []) as NotificationRow[]).map(mapNotification);
}

export async function countUnreadNotifications(
  customerId: string
): Promise<number> {
  const { count, error } = await createAdminClient()
    .from("order_notifications")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customerId)
    .is("read_at", null);

  if (error) {
    if (isMissingRelationError(error)) return 0;
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function markNotificationRead(
  customerId: string,
  notificationId: string
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await createAdminClient()
    .from("order_notifications")
    .update({ read_at: now })
    .eq("id", notificationId)
    .eq("customer_id", customerId)
    .is("read_at", null);

  if (error) {
    if (isMissingRelationError(error)) {
      throw new Error(
        "Tabelas de notificações ainda não existem. Execute supabase/20_order_notifications_messages.sql"
      );
    }
    throw new Error(error.message);
  }
}

export async function markNotificationsRead(
  customerId: string,
  notificationIds: string[]
): Promise<void> {
  if (!notificationIds.length) return;

  const now = new Date().toISOString();
  const { error } = await createAdminClient()
    .from("order_notifications")
    .update({ read_at: now })
    .eq("customer_id", customerId)
    .in("id", notificationIds)
    .is("read_at", null);

  if (error) {
    if (isMissingRelationError(error)) {
      throw new Error(
        "Tabelas de notificações ainda não existem. Execute supabase/20_order_notifications_messages.sql"
      );
    }
    throw new Error(error.message);
  }
}

export async function markAllNotificationsRead(
  customerId: string
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await createAdminClient()
    .from("order_notifications")
    .update({ read_at: now })
    .eq("customer_id", customerId)
    .is("read_at", null);

  if (error) {
    if (isMissingRelationError(error)) {
      throw new Error(
        "Tabelas de notificações ainda não existem. Execute supabase/20_order_notifications_messages.sql"
      );
    }
    throw new Error(error.message);
  }
}

async function markOrderMessagesRead(
  orderId: string,
  senderRole: OrderMessageSenderRole
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await createAdminClient()
    .from("order_messages")
    .update({ read_at: now })
    .eq("order_id", orderId)
    .eq("sender_role", senderRole)
    .is("read_at", null);

  if (error && !isMissingRelationError(error)) {
    throw new Error(error.message);
  }
}

export async function listCustomerOrderMessages(
  customerId: string,
  orderId: string
): Promise<OrderMessage[]> {
  await assertCustomerOwnsOrder(customerId, orderId);

  const { data, error } = await createAdminClient()
    .from("order_messages")
    .select(
      "id, order_id, customer_id, sender_role, body, read_at, created_at"
    )
    .eq("order_id", orderId)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: true });

  if (error) {
    if (isMissingRelationError(error)) return [];
    throw new Error(error.message);
  }

  await markOrderMessagesRead(orderId, "admin");

  return ((data ?? []) as MessageRow[]).map((row) =>
    row.sender_role === "admin" && !row.read_at
      ? mapMessage({ ...row, read_at: new Date().toISOString() })
      : mapMessage(row)
  );
}

export async function sendCustomerOrderMessage(
  customerId: string,
  orderId: string,
  body: string
): Promise<OrderMessage> {
  await assertCustomerOwnsOrder(customerId, orderId);

  const { data, error } = await createAdminClient()
    .from("order_messages")
    .insert({
      order_id: orderId,
      customer_id: customerId,
      sender_role: "customer",
      body,
    })
    .select(
      "id, order_id, customer_id, sender_role, body, read_at, created_at"
    )
    .single();

  if (error) {
    if (isMissingRelationError(error)) {
      throw new Error(
        "Tabelas de mensagens ainda não existem. Execute supabase/20_order_notifications_messages.sql"
      );
    }
    throw new Error(error.message);
  }

  return mapMessage(data as MessageRow);
}

export async function listAdminOrderMessages(
  orderId: string
): Promise<OrderMessage[]> {
  const order = await assertOrderExists(orderId);

  const { data, error } = await createAdminClient()
    .from("order_messages")
    .select(
      "id, order_id, customer_id, sender_role, body, read_at, created_at"
    )
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (error) {
    if (isMissingRelationError(error)) return [];
    throw new Error(error.message);
  }

  if (order.customer_id) {
    await markOrderMessagesRead(orderId, "customer");
  }

  return ((data ?? []) as MessageRow[]).map((row) =>
    row.sender_role === "customer" && !row.read_at
      ? mapMessage({ ...row, read_at: new Date().toISOString() })
      : mapMessage(row)
  );
}

export async function sendAdminOrderMessage(
  orderId: string,
  body: string
): Promise<OrderMessage> {
  const order = await assertOrderExists(orderId);
  if (!order.customer_id) {
    throw new Error("Pedido sem cliente vinculado");
  }

  const { data, error } = await createAdminClient()
    .from("order_messages")
    .insert({
      order_id: orderId,
      customer_id: order.customer_id,
      sender_role: "admin",
      body,
    })
    .select(
      "id, order_id, customer_id, sender_role, body, read_at, created_at"
    )
    .single();

  if (error) {
    if (isMissingRelationError(error)) {
      throw new Error(
        "Tabelas de mensagens ainda não existem. Execute supabase/20_order_notifications_messages.sql"
      );
    }
    throw new Error(error.message);
  }

  const message = mapMessage(data as MessageRow);

  const preview =
    body.length > 140 ? `${body.slice(0, 137).trimEnd()}...` : body;
  const { error: notifError } = await createAdminClient()
    .from("order_notifications")
    .insert({
      order_id: orderId,
      customer_id: order.customer_id,
      kind: "admin_message",
      title: "Nova mensagem sobre o pedido",
      body: preview,
      event_key: `admin_message:${message.id}`,
    });

  if (notifError && !isMissingRelationError(notifError)) {
    console.error(
      "Erro ao criar notificação de mensagem admin:",
      notifError.message
    );
  }

  return message;
}

export async function countAdminUnreadMessages(
  orderId?: string
): Promise<number> {
  let query = createAdminClient()
    .from("order_messages")
    .select("id", { count: "exact", head: true })
    .eq("sender_role", "customer")
    .is("read_at", null);

  if (orderId) {
    query = query.eq("order_id", orderId);
  }

  const { count, error } = await query;

  if (error) {
    if (isMissingRelationError(error)) return 0;
    throw new Error(error.message);
  }

  return count ?? 0;
}
