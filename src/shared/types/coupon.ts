export type CouponType = "percentage" | "fixed" | "free_shipping";

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  minSubtotal: number | null;
  maxUses: number | null;
  maxUsesPerCustomer: number | null;
  usageCount: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CouponApplication {
  code: string;
  type: CouponType;
  discountAmount: number;
  description: string | null;
  grantsFreeShipping: boolean;
}
