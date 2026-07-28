"use client";

import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { CustomerAuthProvider } from "@/contexts/CustomerAuthContext";
import { CartDrawer } from "@/components/store/CartDrawer";

export function StoreProviders({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <CustomerAuthProvider>
        <WishlistProvider>
          {children}
          <CartDrawer />
        </WishlistProvider>
      </CustomerAuthProvider>
    </CartProvider>
  );
}
