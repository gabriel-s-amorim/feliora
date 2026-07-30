"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";

/** Contagem de notificações não lidas do cliente (loja). */
export function useUnreadStoreNotifications() {
  const { user, loading } = useCustomerAuth();
  const pathname = usePathname();
  const [fetchedCount, setFetchedCount] = useState(0);

  useEffect(() => {
    if (loading || !user) return;

    let cancelled = false;

    void fetch("/api/notifications")
      .then(async (res) => {
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { unreadCount?: number };
        if (!cancelled) {
          setFetchedCount(
            typeof data.unreadCount === "number" ? data.unreadCount : 0
          );
        }
      })
      .catch(() => {
        if (!cancelled) setFetchedCount(0);
      });

    return () => {
      cancelled = true;
    };
  }, [user, loading, pathname]);

  return { unreadCount: user ? fetchedCount : 0, loading };
}
