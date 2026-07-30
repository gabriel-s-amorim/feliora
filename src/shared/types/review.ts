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
