export type AdminNotificationKind =
  | "customer_registered"
  | "order_created"
  | "payment_approved"
  | "customer_message";

export interface AdminNotification {
  id: string;
  kind: AdminNotificationKind;
  title: string;
  body: string;
  linkPath: string | null;
  orderId: string | null;
  customerId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface AdminNotificationsListResponse {
  notifications: AdminNotification[];
  unreadCount: number;
}
