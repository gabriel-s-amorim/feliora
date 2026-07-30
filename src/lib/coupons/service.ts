import {
  applyCouponToSubtotal,
  CouponEvalError,
  couponErrorMessage,
  normalizeCouponCode,
} from "@/shared/lib/coupons";
import type { Coupon, CouponApplication } from "@/shared/types/coupon";
import { createAdminClient } from "@/lib/supabase/admin";

const COUPON_SELECT =
  "id, code, type, value, is_active, starts_at, ends_at, min_subtotal, max_uses, max_uses_per_customer, usage_count, description, created_at, updated_at";

export type CouponRow = {
  id: string;
  code: string;
  type: Coupon["type"];
  value: number | string;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  min_subtotal: number | string | null;
  max_uses: number | null;
  max_uses_per_customer: number | null;
  usage_count: number;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export function mapCouponRow(row: CouponRow): Coupon {
  return {
    id: row.id,
    code: row.code,
    type: row.type,
    value: Number(row.value),
    isActive: row.is_active,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    minSubtotal:
      row.min_subtotal == null ? null : Number(row.min_subtotal),
    maxUses: row.max_uses,
    maxUsesPerCustomer: row.max_uses_per_customer,
    usageCount: Number(row.usage_count),
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findCouponByCode(code: string): Promise<Coupon | null> {
  const normalized = normalizeCouponCode(code);
  if (!normalized) return null;

  const { data, error } = await createAdminClient()
    .from("coupons")
    .select(COUPON_SELECT)
    .ilike("code", normalized)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar cupom: ${error.message}`);
  }

  return data ? mapCouponRow(data as CouponRow) : null;
}

async function countCustomerCouponUses(
  customerId: string,
  code: string
): Promise<number> {
  const { count, error } = await createAdminClient()
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customerId)
    .ilike("coupon_code", normalizeCouponCode(code))
    .neq("status", "canceled");

  if (error) {
    throw new Error(`Erro ao contar usos do cupom: ${error.message}`);
  }

  return count ?? 0;
}

export async function assertCouponApplicable(params: {
  code: string;
  subtotal: number;
  customerId?: string | null;
}): Promise<CouponApplication> {
  const coupon = await findCouponByCode(params.code);
  if (!coupon) {
    throw new CouponEvalError("invalid", "Cupom inválido");
  }

  let customerUsageCount: number | undefined;
  if (params.customerId && coupon.maxUsesPerCustomer != null) {
    customerUsageCount = await countCustomerCouponUses(
      params.customerId,
      coupon.code
    );
  }

  try {
    return applyCouponToSubtotal(coupon, {
      subtotal: params.subtotal,
      customerUsageCount,
    });
  } catch (error) {
    if (error instanceof CouponEvalError) {
      throw new CouponEvalError(
        error.code,
        couponErrorMessage(error),
        error.minSubtotal
      );
    }
    throw error;
  }
}

export async function incrementCouponUsage(code: string): Promise<void> {
  const { error } = await createAdminClient().rpc("increment_coupon_usage", {
    p_code: code,
  });
  if (error) throw new Error(error.message);
}

export { CouponEvalError };
