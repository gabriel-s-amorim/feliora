export type OrderNotificationKind =
  | "order_created"
  | "payment_status"
  | "fulfillment_status"
  | "tracking_updated"
  | "order_canceled"
  | "admin_message";

export type OrderMessageSenderRole = "customer" | "admin";

export interface OrderNotification {
  id: string;
  orderId: string;
  customerId: string;
  kind: OrderNotificationKind;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export interface OrderMessage {
  id: string;
  orderId: string;
  customerId: string;
  senderRole: OrderMessageSenderRole;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsListResponse {
  notifications: OrderNotification[];
  unreadCount: number;
}

export interface OrderMessagesListResponse {
  messages: OrderMessage[];
  unreadCount: number;
}
