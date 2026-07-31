import type {
  AdminProductReview,
  ProductReview,
  ReviewEligibility,
} from "@/shared/types/review";
import type { CreateProductReviewInput } from "@/shared/schemas/review";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createPublicClient,
  hasSupabasePublicEnv,
} from "@/lib/supabase/public";

export type { AdminProductReview, ReviewEligibility };

type ReviewRow = {
  id: string;
  product_id: number;
  customer_id: string | null;
  order_id: string | null;
  author_name: string;
  rating: number;
  title: string;
  body: string;
  is_approved: boolean;
  created_at: string;
};

function mapReview(row: ReviewRow): ProductReview {
  return {
    id: row.id,
    productId: row.product_id,
    authorName: row.author_name,
    rating: row.rating,
    title: row.title ?? "",
    body: row.body ?? "",
    isApproved: row.is_approved,
    createdAt: row.created_at,
  };
}

export async function listApprovedProductReviews(
  productId: number,
  limit = 20
): Promise<ProductReview[]> {
  if (!hasSupabasePublicEnv()) return [];

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("product_reviews")
      .select(
        "id, product_id, author_name, rating, title, body, is_approved, created_at"
      )
      .eq("product_id", productId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return (data as ReviewRow[]).map(mapReview);
  } catch {
    return [];
  }
}

async function findDeliveredOrderForProduct(
  customerId: string,
  productId: number,
  productSlug: string
): Promise<string | null> {
  const supabase = createAdminClient();

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id")
    .eq("customer_id", customerId)
    .eq("fulfillment_status", "delivered")
    .order("created_at", { ascending: false })
    .limit(50);

  if (ordersError || !orders?.length) return null;

  const orderIds = orders.map((o) => o.id as string);

  const { data: bySlug, error: slugError } = await supabase
    .from("order_items")
    .select("order_id")
    .in("order_id", orderIds)
    .eq("product_slug", productSlug)
    .limit(1);

  if (!slugError && bySlug?.[0]?.order_id) {
    return String(bySlug[0].order_id);
  }

  // Fallback canônico: variant_id → product_variants.product_id
  const { data: variants } = await supabase
    .from("product_variants")
    .select("id")
    .eq("product_id", productId);

  const variantIds = (variants ?? []).map((v) => v.id as string);
  if (!variantIds.length) return null;

  const { data: byVariant } = await supabase
    .from("order_items")
    .select("order_id")
    .in("order_id", orderIds)
    .in("variant_id", variantIds)
    .limit(1);

  return byVariant?.[0]?.order_id ? String(byVariant[0].order_id) : null;
}

export async function getCustomerReviewForProduct(
  customerId: string,
  productId: number
): Promise<ProductReview | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("product_reviews")
    .select(
      "id, product_id, customer_id, order_id, author_name, rating, title, body, is_approved, created_at"
    )
    .eq("product_id", productId)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (error || !data) return null;
  return mapReview(data as ReviewRow);
}

export async function getReviewEligibility(
  customerId: string | null,
  productId: number,
  productSlug: string
): Promise<ReviewEligibility> {
  if (!customerId) {
    return {
      authenticated: false,
      canReview: false,
      reason: "unauthenticated",
    };
  }

  const existing = await getCustomerReviewForProduct(customerId, productId);
  if (existing) {
    return {
      authenticated: true,
      canReview: false,
      reason: existing.isApproved ? "already_reviewed" : "pending_review",
      existingReviewId: existing.id,
      existingApproved: existing.isApproved,
    };
  }

  const orderId = await findDeliveredOrderForProduct(
    customerId,
    productId,
    productSlug
  );

  if (!orderId) {
    return {
      authenticated: true,
      canReview: false,
      reason: "not_purchased",
    };
  }

  return {
    authenticated: true,
    canReview: true,
    reason: "ok",
  };
}

async function resolveAuthorName(
  customerId: string,
  provided?: string
): Promise<string> {
  const trimmed = provided?.trim();
  if (trimmed) return trimmed;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("customer_profiles")
    .select("full_name")
    .eq("id", customerId)
    .maybeSingle();

  const fromProfile = data?.full_name?.trim();
  if (fromProfile) return fromProfile;
  return "Cliente Feliora";
}

async function notifyReviewSubmitted(input: {
  reviewId: string;
  productId: number;
  productSlug: string;
  authorName: string;
  rating: number;
  customerId: string;
}): Promise<void> {
  const supabase = createAdminClient();
  const title = "Nova avaliação pendente";
  const body = `${input.authorName} avaliou um produto com ${input.rating}★ — aguardando aprovação.`;

  // Schema canônico (kind/body/link_path/event_key)
  const canonical = await supabase.from("admin_notifications").insert({
    kind: "review_submitted",
    title,
    body,
    link_path: "/admin/avaliacoes",
    customer_id: input.customerId,
    event_key: `review_submitted:${input.reviewId}`,
  });

  if (!canonical.error) return;

  // Schema legado (type/message/entity_type)
  await supabase.from("admin_notifications").insert({
    type: "review_submitted",
    title,
    message: body,
    entity_type: "review",
    entity_id: input.reviewId,
  });
}

export async function createProductReview(
  customerId: string,
  input: CreateProductReviewInput
): Promise<ProductReview> {
  const eligibility = await getReviewEligibility(
    customerId,
    input.productId,
    input.productSlug
  );

  if (!eligibility.canReview) {
    if (eligibility.reason === "already_reviewed") {
      throw new Error("Você já avaliou este produto");
    }
    if (eligibility.reason === "pending_review") {
      throw new Error("Sua avaliação ainda está aguardando aprovação");
    }
    if (eligibility.reason === "not_purchased") {
      throw new Error(
        "Só é possível avaliar produtos de pedidos já entregues"
      );
    }
    throw new Error("Não é possível avaliar este produto");
  }

  const orderId = await findDeliveredOrderForProduct(
    customerId,
    input.productId,
    input.productSlug
  );

  const authorName = await resolveAuthorName(customerId, input.authorName);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("product_reviews")
    .insert({
      product_id: input.productId,
      customer_id: customerId,
      order_id: orderId,
      author_name: authorName,
      rating: input.rating,
      title: input.title ?? "",
      body: input.body,
      is_approved: false,
    })
    .select(
      "id, product_id, customer_id, order_id, author_name, rating, title, body, is_approved, created_at"
    )
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      throw new Error("Você já avaliou este produto");
    }
    throw new Error(error?.message ?? "Erro ao criar avaliação");
  }

  const review = mapReview(data as ReviewRow);

  await notifyReviewSubmitted({
    reviewId: review.id,
    productId: input.productId,
    productSlug: input.productSlug,
    authorName,
    rating: input.rating,
    customerId,
  }).catch(() => undefined);

  return review;
}

export async function listAdminReviews(
  status: "pending" | "approved" | "all" = "pending"
): Promise<AdminProductReview[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("product_reviews")
    .select(
      "id, product_id, customer_id, order_id, author_name, rating, title, body, is_approved, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (status === "pending") query = query.eq("is_approved", false);
  if (status === "approved") query = query.eq("is_approved", true);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as ReviewRow[];
  if (!rows.length) return [];

  const productIds = [...new Set(rows.map((r) => r.product_id))];
  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug")
    .in("id", productIds);

  const byId = new Map(
    (products ?? []).map((p) => [
      Number(p.id),
      { name: String(p.name), slug: String(p.slug) },
    ])
  );

  return rows.map((row) => {
    const product = byId.get(row.product_id);
    return {
      ...mapReview(row),
      customerId: row.customer_id,
      orderId: row.order_id,
      productName: product?.name ?? `Produto #${row.product_id}`,
      productSlug: product?.slug ?? "",
    };
  });
}

export async function approveProductReview(
  reviewId: string
): Promise<ProductReview> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("product_reviews")
    .update({ is_approved: true })
    .eq("id", reviewId)
    .select(
      "id, product_id, customer_id, order_id, author_name, rating, title, body, is_approved, created_at"
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Avaliação não encontrada");
  }

  return mapReview(data as ReviewRow);
}

export async function rejectProductReview(reviewId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("product_reviews")
    .delete()
    .eq("id", reviewId);

  if (error) throw new Error(error.message);
}
