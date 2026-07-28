export type CartItem = {
  id: string;
  cartId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  productName: string;
  productSlug: string;
  productImage: string;
  sku: string;
  sizeLabel: string;
  colorName: string;
  stockCount?: number;
};

export type Cart = {
  id: string;
  sessionId: string | null;
  customerId: string | null;
  status: "active" | "converted";
  couponCode: string | null;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
};
