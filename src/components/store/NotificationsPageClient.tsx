"use client";

import {
  Bell,
  CheckCheck,
  CreditCard,
  MessageCircle,
  Package,
  PackageCheck,
  Truck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { cn } from "@/lib/utils";
import type {
  OrderNotification,
  OrderNotificationKind,
} from "@/shared/types/orderCommunication";

function kindIcon(kind: OrderNotificationKind) {
  switch (kind) {
    case "payment_status":
      return CreditCard;
    case "fulfillment_status":
      return Package;
    case "tracking_updated":
      return Truck;
    case "order_canceled":
      return XCircle;
    case "admin_message":
      return MessageCircle;
    case "order_created":
    default:
      return PackageCheck;
  }
}

function formatWhen(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationsPageClient() {
  const { user, loading: authLoading } = useCustomerAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(
        `/conta/entrar?next=${encodeURIComponent("/notificacoes")}`
      );
      return;
    }

    let cancelled = false;

    void fetch("/api/notifications")
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (res.status === 401) {
          router.replace(
            `/conta/entrar?next=${encodeURIComponent("/notificacoes")}`
          );
          return;
        }
        if (!res.ok) {
          throw new Error(
            data.error ?? "Não foi possível carregar as notificações"
          );
        }
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Erro ao carregar notificações"
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, router, reloadKey]);

  async function markAllRead() {
    setMarkingAll(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Não foi possível marcar como lidas");
      }
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          readAt: n.readAt ?? new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao marcar como lidas");
    } finally {
      setMarkingAll(false);
    }
  }

  async function openNotification(notification: OrderNotification) {
    if (!notification.readAt) {
      void fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notification.id }),
      })
        .then(async (res) => {
          if (!res.ok) return;
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === notification.id
                ? { ...n, readAt: n.readAt ?? new Date().toISOString() }
                : n
            )
          );
          setUnreadCount((c) => Math.max(0, c - 1));
        })
        .catch(() => {
          // não bloqueia navegação
        });
    }
    router.push(`/conta/pedidos/${notification.orderId}`);
  }

  if (authLoading || (!user && loading)) {
    return (
      <div className="mx-auto max-w-lg animate-pulse px-4 py-10">
        <div className="h-7 w-40 bg-ivory" />
        <div className="mt-6 space-y-3">
          <div className="h-20 bg-ivory" />
          <div className="h-20 bg-ivory" />
          <div className="h-20 bg-ivory" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.35em] text-rose-gold">
            Conta
          </p>
          <h1 className="mt-1 font-display text-3xl font-light tracking-[0.06em] text-ink">
            Notificações
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {unreadCount > 0
              ? `${unreadCount} não lida${unreadCount === 1 ? "" : "s"}`
              : "Tudo em dia"}
          </p>
        </div>
        {unreadCount > 0 ? (
          <button
            type="button"
            disabled={markingAll}
            onClick={() => void markAllRead()}
            className="inline-flex min-h-10 items-center gap-1.5 border border-line px-3 text-[11px] tracking-[0.08em] text-ink-muted transition-colors hover:border-rose-gold hover:text-rose-gold disabled:opacity-50"
          >
            <CheckCheck className="size-3.5" strokeWidth={1.5} />
            {markingAll ? "Marcando…" : "Marcar todas"}
          </button>
        ) : null}
      </header>

      {loading ? (
        <div className="mt-8 space-y-3 animate-pulse">
          <div className="h-20 bg-ivory" />
          <div className="h-20 bg-ivory" />
          <div className="h-20 bg-ivory" />
        </div>
      ) : error ? (
        <div className="mt-8 border border-rose-gold/30 bg-rose-gold/5 px-4 py-5 text-sm text-rose-gold">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setError(null);
              setReloadKey((k) => k + 1);
            }}
            className="mt-3 text-xs tracking-[0.1em] underline-offset-2 hover:underline"
          >
            Tentar de novo
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="mt-10 flex flex-col items-center border border-line bg-cream/50 px-6 py-14 text-center">
          <Bell className="size-8 text-rose-gold/70" strokeWidth={1.25} />
          <p className="mt-4 font-display text-lg tracking-[0.04em] text-ink">
            Nenhuma notificação
          </p>
          <p className="mt-2 max-w-xs text-sm text-ink-muted">
            Assim que houver novidades nos seus pedidos, elas aparecem aqui.
          </p>
          <Link
            href="/catalogo"
            className="mt-6 min-h-11 border border-rose-gold bg-rose-gold px-5 text-xs tracking-[0.14em] text-cream"
          >
            Ver catálogo
          </Link>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-line border border-line bg-cream/40">
          {notifications.map((notification) => {
            const Icon = kindIcon(notification.kind);
            const unread = !notification.readAt;
            return (
              <li key={notification.id}>
                <button
                  type="button"
                  onClick={() => void openNotification(notification)}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-ivory/70",
                    unread && "bg-rose-gold/[0.06]"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border",
                      unread
                        ? "border-rose-gold/40 bg-rose-gold/10 text-rose-gold"
                        : "border-line bg-cream text-ink-muted"
                    )}
                  >
                    <Icon className="size-4" strokeWidth={1.5} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span
                        className={cn(
                          "text-sm text-ink",
                          unread && "font-medium"
                        )}
                      >
                        {notification.title}
                      </span>
                      <span className="shrink-0 text-[10px] tracking-wide text-ink-muted">
                        {formatWhen(notification.createdAt)}
                      </span>
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-ink-muted">
                      {notification.body}
                    </span>
                    {unread ? (
                      <span className="mt-2 inline-block size-1.5 rounded-full bg-rose-gold" />
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
