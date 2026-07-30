"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { StoreBottomNav } from "@/components/store/StoreBottomNav";
import { cn } from "@/lib/utils";

function hideTabBar(pathname: string) {
  if (pathname.startsWith("/checkout")) return true;
  if (pathname.startsWith("/produto/")) return true;
  if (pathname === "/carrinho") return true;
  if (pathname.startsWith("/conta/entrar") || pathname.startsWith("/conta/criar"))
    return true;
  return false;
}

export function StoreMobileChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const tabsHidden = hideTabBar(pathname);
  const checkoutActive = pathname.startsWith("/checkout");

  return (
    <>
      <div
        className={cn(
          checkoutActive && "[&>footer]:hidden",
          !tabsHidden &&
            "pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0"
        )}
      >
        {children}
      </div>
      <StoreBottomNav />
    </>
  );
}
