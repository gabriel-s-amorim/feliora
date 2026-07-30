"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  startTransition,
} from "react";
import type { Cart } from "@/shared/types/cart";
import type { CouponApplication } from "@/shared/types/coupon";
import { emptyCart } from "@/lib/cart/empty";

type CartContextValue = {
  cart: Cart;
  couponApplication: CouponApplication | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (variantId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  removeCoupon: () => Promise<void>;
  refresh: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>(emptyCart());
  const [couponApplication, setCouponApplication] =
    useState<CouponApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao carregar carrinho");
      setCart(data.cart ?? emptyCart());
      setCouponApplication(data.couponApplication ?? null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no carrinho");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      void refresh();
    });
  }, [refresh]);

  useEffect(() => {
    const onRefresh = () => {
      void refresh();
    };
    window.addEventListener("feliora:cart-refresh", onRefresh);
    return () => window.removeEventListener("feliora:cart-refresh", onRefresh);
  }, [refresh]);

  const addItem = useCallback(
    async (variantId: string, quantity = 1) => {
      setError(null);
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, quantity }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível adicionar");
        return false;
      }
      setCart(data.cart);
      setCouponApplication(data.couponApplication ?? null);
      setDrawerOpen(true);
      return true;
    },
    []
  );

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    setError(null);
    const res = await fetch(`/api/cart/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Não foi possível atualizar");
      return;
    }
    setCart(data.cart);
    setCouponApplication(data.couponApplication ?? null);
  }, []);

  const removeItem = useCallback(async (itemId: string) => {
    setError(null);
    const res = await fetch(`/api/cart/items/${itemId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Não foi possível remover");
      return;
    }
    setCart(data.cart);
    setCouponApplication(data.couponApplication ?? null);
  }, []);

  const applyCoupon = useCallback(async (code: string) => {
    const res = await fetch("/api/cart/coupon", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        ok: false as const,
        error: typeof data.error === "string" ? data.error : "Cupom inválido",
      };
    }
    setCart(data.cart);
    setCouponApplication(data.couponApplication ?? null);
    return { ok: true as const };
  }, []);

  const removeCoupon = useCallback(async () => {
    const res = await fetch("/api/cart/coupon", { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Não foi possível remover o cupom");
      return;
    }
    setCart(data.cart);
    setCouponApplication(null);
  }, []);

  const value = useMemo(
    () => ({
      cart,
      couponApplication,
      loading,
      refreshing,
      error,
      drawerOpen,
      openDrawer,
      closeDrawer,
      addItem,
      updateQuantity,
      removeItem,
      applyCoupon,
      removeCoupon,
      refresh,
    }),
    [
      cart,
      couponApplication,
      loading,
      refreshing,
      error,
      drawerOpen,
      openDrawer,
      closeDrawer,
      addItem,
      updateQuantity,
      removeItem,
      applyCoupon,
      removeCoupon,
      refresh,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de CartProvider");
  return ctx;
}
