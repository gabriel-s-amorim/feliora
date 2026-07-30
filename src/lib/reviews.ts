import type { ProductReview } from "@/shared/types/review";
import {
  createPublicClient,
  hasSupabasePublicEnv,
} from "@/lib/supabase/public";

type ReviewRow = {
  id: string;
  product_id: number;
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
