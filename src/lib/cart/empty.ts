import type { Cart } from "@/shared/types/cart";

/** Espelho client-safe de emptyCart (sem deps de server). */
export function emptyCart(): Cart {
  return {
    id: "",
    sessionId: null,
    customerId: null,
    status: "active",
    couponCode: null,
    items: [],
    itemCount: 0,
    subtotal: 0,
  };
}
