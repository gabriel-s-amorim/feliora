import {
  approveProductReview,
  listAdminReviews,
  rejectProductReview,
} from "@/lib/reviews";
import type { AdminProductReview } from "@/shared/types/review";

export async function listAdminProductReviews(
  status: "pending" | "approved" | "all" = "pending"
): Promise<AdminProductReview[]> {
  return listAdminReviews(status);
}

export async function setAdminReviewApproved(
  reviewId: string
): Promise<AdminProductReview> {
  const review = await approveProductReview(reviewId);
  const [enriched] = await listAdminReviews("all").then((rows) =>
    rows.filter((r) => r.id === review.id)
  );
  return (
    enriched ?? {
      ...review,
      customerId: null,
      orderId: null,
      productName: `Produto #${review.productId}`,
      productSlug: "",
    }
  );
}

export async function deleteAdminReview(reviewId: string): Promise<void> {
  await rejectProductReview(reviewId);
}
