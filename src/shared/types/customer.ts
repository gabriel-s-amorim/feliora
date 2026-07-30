import type { ShippingAddress } from "@/shared/types/address";
import type { AdminOrderSummary } from "@/shared/types/order";

export interface AdminCustomerSummary {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
}

export interface AdminCustomerDetail extends AdminCustomerSummary {
  addresses: Array<
    ShippingAddress & {
      id: string;
      label: string;
      isDefault: boolean;
    }
  >;
  orders: AdminOrderSummary[];
}
