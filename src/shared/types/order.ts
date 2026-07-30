import type { ShippingAddress } from "@/shared/types/address";
import type {
  CheckoutPaymentResult,
  PaymentInstructions,
  PaymentStatus,
} from "@/shared/types/mercadoPago";
import type { MelhorEnvioEnvironment } from "@/shared/types/melhorEnvio";

export type { ShippingAddress };

export type OrderStatus = "pending" | "paid" | "canceled";

export type FulfillmentStatus =
  | "unfulfilled"
  | "processing"
  | "shipped"
  | "delivered"
  | "canceled";

export type PaymentMethod = "pix" | "credit_card" | "boleto";

export interface OrderItem {
  id: string;
  orderId: string;
  variantId: string | null;
  productSlug: string;
  productName: string;
  quantity: number;
  price: number;
  sizeLabel: string;
  colorName: string;
  image: string;
  sku: string;
}

export interface Order {
  id: string;
  customerId: string | null;
  status: OrderStatus;
  totalAmount: number;
  shippingAmount: number;
  discountAmount: number;
  shippingQuoteId: string | null;
  shippingServiceId: string | null;
  shippingServiceName: string | null;
  shippingCompany: string | null;
  shippingDeliveryDays: number | null;
  shippingEnvironment: MelhorEnvioEnvironment | null;
  shippingRecipient: {
    name: string;
    email: string;
    phone: string;
    document: string;
  } | null;
  couponCode: string | null;
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentStatusDetail: string | null;
  paymentExpiresAt: string | null;
  paidAt: string | null;
  paymentInstructions: PaymentInstructions | null;
  fulfillmentStatus: FulfillmentStatus;
  trackingCode: string | null;
  trackingUrl: string | null;
  processingAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  canceledAt: string | null;
  stockDecrementedAt: string | null;
  stockRestoredAt: string | null;
  items: OrderItem[];
  createdAt: string;
}

export interface CheckoutResponse {
  success: true;
  order: Order;
  payment: CheckoutPaymentResult;
}

export interface OrderSummary {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  shippingAmount: number;
  discountAmount: number;
  couponCode: string | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  trackingCode: string | null;
  trackingUrl: string | null;
  paidAt: string | null;
  processingAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  itemCount: number;
  createdAt: string;
}

export interface AdminOrderSummary extends OrderSummary {
  customerId: string | null;
  customerName: string | null;
  customerEmail: string | null;
  stockDecrementedAt: string | null;
  stockRestoredAt: string | null;
}

export interface AdminOrderDetail extends Order {
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  shipments: Array<{
    id: string;
    volumeIndex: number;
    status: "pending" | "processing" | "in_cart" | "failed";
    melhorEnvioCartId: string | null;
    errorMessage: string | null;
    attemptCount: number;
  }>;
}
