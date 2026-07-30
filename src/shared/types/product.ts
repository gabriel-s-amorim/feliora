export type ProductSizeMeta = {
  label: string;
};

export type ProductColorMeta = {
  name: string;
  hex: string;
  imageUrl?: string;
};

export type ProductVariant = {
  id: string;
  productId: number;
  sizeLabel: string;
  colorName: string;
  sku: string;
  stockCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: number;
  slug: string;
  name: string;
  categoryId: string | null;
  price: number;
  originalPrice: number | null;
  image: string;
  images: string[];
  badge: string;
  badgeColor: string;
  featured: boolean;
  isNew: boolean;
  shortDescription: string;
  seoTitle: string;
  seoDescription: string;
  description: string;
  materials: string[];
  careInstructions: string[];
  sizes: ProductSizeMeta[];
  colors: ProductColorMeta[];
  inStock: boolean;
  stockCount: number;
  widthCm: number | null;
  heightCm: number | null;
  lengthCm: number | null;
  weightKg: number | null;
  faq: { question: string; answer: string }[];
  highlights: string[];
  ratingAvg: number;
  reviewsCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  variants?: ProductVariant[];
  category?: { id: string; slug: string; name: string } | null;
};
