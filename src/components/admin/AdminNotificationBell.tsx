"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function AdminNotificationBell({ className }: { className?: string }) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/admin/notifications")
      .then(async (res) => {
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { unreadCount?: number };
        if (!cancelled) {
          setUnreadCount(
            typeof data.unreadCount === "number" ? data.unreadCount : 0
          );
        }
      })
      .catch(() => {
        if (!cancelled) setUnreadCount(0);
      });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const active = pathname.startsWith("/admin/notificacoes");

  return (
    <Link
      href="/admin/notificacoes"
      className={cn(
        "relative inline-flex size-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50",
        active && "border-zinc-900 bg-zinc-950 text-white hover:bg-zinc-900",
        className
      )}
      aria-label={
        unreadCount > 0
          ? `Notificações (${unreadCount} não lidas)`
          : "Notificações"
      }
    >
      <Bell className="size-4" strokeWidth={active ? 2.25 : 1.75} />
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-semibold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
