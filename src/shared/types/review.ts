export type ProductReview = {
  id: string;
  productId: number;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  isApproved: boolean;
  createdAt: string;
};

export type ReviewEligibility = {
  authenticated: boolean;
  canReview: boolean;
  reason:
    | "ok"
    | "unauthenticated"
    | "not_purchased"
    | "already_reviewed"
    | "pending_review";
  existingReviewId?: string;
  existingApproved?: boolean;
};

export type AdminProductReview = ProductReview & {
  customerId: string | null;
  orderId: string | null;
  productName: string;
  productSlug: string;
};
