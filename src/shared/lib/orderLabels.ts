import type { OrderSummary } from "@/shared/types/order";
import type { PaymentStatus } from "@/shared/types/mercadoPago";
import type { FulfillmentStatus, PaymentMethod } from "@/shared/types/order";

export type CustomerOrderFilter =
  | "all"
  | "to_pay"
  | "preparing"
  | "shipping"
  | "review";

export function paymentStatusLabel(status: PaymentStatus | string): string {
  const map: Record<string, string> = {
    approved: "Pago",
    pending: "Aguardando pagamento",
    processing: "Processando pagamento",
    rejected: "Pagamento recusado",
    canceled: "Pagamento cancelado",
    expired: "Pagamento expirado",
    refunded: "Estornado",
  };
  return map[status] ?? status;
}

export function fulfillmentStatusLabel(
  status: FulfillmentStatus | string
): string {
  const map: Record<string, string> = {
    unfulfilled: "Aguardando preparação",
    processing: "Preparando",
    shipped: "A caminho",
    delivered: "Entregue",
    canceled: "Cancelado",
  };
  return map[status] ?? status;
}

export function paymentMethodLabel(method: PaymentMethod | string): string {
  const map: Record<string, string> = {
    pix: "Pix",
    credit_card: "Cartão de crédito",
    boleto: "Boleto",
  };
  return map[method] ?? method;
}

export function customerOrderStatusLabel(order: {
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
}): string {
  if (order.status === "canceled" || order.fulfillmentStatus === "canceled") {
    return "Cancelado";
  }
  if (
    order.paymentStatus === "pending" ||
    order.paymentStatus === "processing"
  ) {
    return "A pagar";
  }
  if (order.paymentStatus === "rejected" || order.paymentStatus === "expired") {
    return paymentStatusLabel(order.paymentStatus);
  }
  if (order.fulfillmentStatus === "delivered") return "Entregue";
  if (order.fulfillmentStatus === "shipped") return "A caminho";
  if (order.fulfillmentStatus === "processing") return "Preparando";
  if (order.paymentStatus === "approved") return "Pago · Preparando";
  return paymentStatusLabel(order.paymentStatus);
}

export function isOrderToPay(order: OrderSummary): boolean {
  if (order.status === "canceled") return false;
  return (
    order.paymentStatus === "pending" || order.paymentStatus === "processing"
  );
}

export function isOrderPreparing(order: OrderSummary): boolean {
  if (order.status === "canceled") return false;
  if (order.paymentStatus !== "approved") return false;
  return (
    order.fulfillmentStatus === "unfulfilled" ||
    order.fulfillmentStatus === "processing"
  );
}

export function isOrderShipping(order: OrderSummary): boolean {
  return order.fulfillmentStatus === "shipped";
}

export function isOrderToReview(order: OrderSummary): boolean {
  return order.fulfillmentStatus === "delivered";
}

export function filterCustomerOrders(
  orders: OrderSummary[],
  filter: CustomerOrderFilter
): OrderSummary[] {
  switch (filter) {
    case "to_pay":
      return orders.filter(isOrderToPay);
    case "preparing":
      return orders.filter(isOrderPreparing);
    case "shipping":
      return orders.filter(isOrderShipping);
    case "review":
      return orders.filter(isOrderToReview);
    default:
      return orders;
  }
}

export function countCustomerOrderShortcuts(orders: OrderSummary[]) {
  return {
    toPay: orders.filter(isOrderToPay).length,
    preparing: orders.filter(isOrderPreparing).length,
    shipping: orders.filter(isOrderShipping).length,
    review: orders.filter(isOrderToReview).length,
  };
}
