import {
  mapCouponRow,
  type CouponRow,
} from "@/lib/coupons/service";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeCouponCode } from "@/shared/lib/coupons";
import type {
  CouponCreateInput,
  CouponUpdateInput,
} from "@/shared/schemas/coupon";
import type { Coupon } from "@/shared/types/coupon";

const COUPON_SELECT =
  "id, code, type, value, is_active, starts_at, ends_at, min_subtotal, max_uses, max_uses_per_customer, usage_count, description, created_at, updated_at";

function toRow(input: CouponCreateInput | CouponUpdateInput) {
  const row: Record<string, unknown> = {};
  if ("code" in input && input.code != null) {
    row.code = normalizeCouponCode(input.code);
  }
  if ("type" in input && input.type != null) row.type = input.type;
  if ("value" in input && input.value != null) row.value = input.value;
  if ("isActive" in input && input.isActive != null) {
    row.is_active = input.isActive;
  }
  if ("endsAt" in input) {
    row.ends_at = input.endsAt || null;
  }
  if ("minSubtotal" in input) {
    row.min_subtotal = input.minSubtotal ?? null;
  }
  if ("maxUses" in input) {
    row.max_uses = input.maxUses ?? null;
  }
  return row;
}

export async function listAdminCoupons(search?: string): Promise<Coupon[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("coupons")
    .select(COUPON_SELECT)
    .order("created_at", { ascending: false });

  const term = search?.trim();
  if (term) {
    query = query.ilike("code", `%${normalizeCouponCode(term)}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as CouponRow[]).map(mapCouponRow);
}

export async function getAdminCoupon(id: string): Promise<Coupon | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("coupons")
    .select(COUPON_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapCouponRow(data as CouponRow) : null;
}

export async function createAdminCoupon(
  input: CouponCreateInput
): Promise<Coupon> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("coupons")
    .insert(toRow(input))
    .select(COUPON_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return mapCouponRow(data as CouponRow);
}

export async function updateAdminCoupon(
  id: string,
  input: CouponUpdateInput
): Promise<Coupon> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("coupons")
    .update(toRow(input))
    .eq("id", id)
    .select(COUPON_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return mapCouponRow(data as CouponRow);
}

export async function deleteAdminCoupon(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
