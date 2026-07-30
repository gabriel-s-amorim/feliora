"use client";

import {
  Bell,
  CheckCheck,
  CreditCard,
  MessageCircle,
  ShoppingBag,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminShell, RequireAdmin } from "@/components/admin/AdminShell";
import { AdminButton, AdminSpinner } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import type {
  AdminNotification,
  AdminNotificationKind,
} from "@/shared/types/adminNotification";

function kindIcon(kind: AdminNotificationKind) {
  switch (kind) {
    case "customer_registered":
      return UserPlus;
    case "order_created":
      return ShoppingBag;
    case "payment_approved":
      return CreditCard;
    case "customer_message":
      return MessageCircle;
    default:
      return Bell;
  }
}

function formatWhen(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminNotificationsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/admin/notifications")
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          throw new Error(data.error ?? "Erro ao carregar notificações");
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
  }, [reloadKey, pathname]);

  async function markAllRead() {
    setMarkingAll(true);
    try {
      const res = await fetch("/api/admin/notifications", {
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

  async function openNotification(notification: AdminNotification) {
    if (!notification.readAt) {
      void fetch("/api/admin/notifications", {
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
    if (notification.linkPath) {
      router.push(notification.linkPath);
    }
  }

  return (
    <RequireAdmin>
      <AdminShell
        title="Notificações"
        description="Cadastros, pedidos, pagamentos e mensagens dos clientes"
        actions={
          unreadCount > 0 ? (
            <AdminButton
              variant="secondary"
              disabled={markingAll}
              onClick={() => void markAllRead()}
            >
              <CheckCheck className="size-3.5" />
              {markingAll ? "Marcando…" : "Marcar todas"}
            </AdminButton>
          ) : null
        }
      >
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <AdminSpinner /> Carregando…
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setError(null);
                setReloadKey((k) => k + 1);
              }}
              className="mt-2 text-xs font-medium underline-offset-2 hover:underline"
            >
              Tentar de novo
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white px-6 py-16 text-center">
            <Bell className="size-8 text-zinc-300" strokeWidth={1.25} />
            <p className="mt-4 text-sm font-medium text-zinc-900">
              Nenhuma notificação
            </p>
            <p className="mt-1 max-w-sm text-sm text-zinc-500">
              Quando um cliente se cadastrar, fizer um pedido, pagar ou enviar
              mensagem, o aviso aparece aqui.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white">
            {notifications.map((notification) => {
              const Icon = kindIcon(notification.kind);
              const unread = !notification.readAt;
              return (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => void openNotification(notification)}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-zinc-50",
                      unread && "bg-zinc-50/80"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl",
                        unread
                          ? "bg-zinc-950 text-white"
                          : "bg-zinc-100 text-zinc-500"
                      )}
                    >
                      <Icon className="size-4" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span
                          className={cn(
                            "text-sm text-zinc-900",
                            unread && "font-semibold"
                          )}
                        >
                          {notification.title}
                        </span>
                        <span className="shrink-0 text-[11px] text-zinc-400">
                          {formatWhen(notification.createdAt)}
                        </span>
                      </span>
                      <span className="mt-1 block text-sm leading-relaxed text-zinc-500">
                        {notification.body}
                      </span>
                      {notification.linkPath ? (
                        <span className="mt-2 inline-flex text-xs font-medium text-zinc-700">
                          Abrir →
                        </span>
                      ) : null}
                    </span>
                    {unread ? (
                      <span className="mt-2 size-2 shrink-0 rounded-full bg-zinc-950" />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-4 text-center text-xs text-zinc-400 lg:hidden">
          <Link href="/admin/pedidos" className="hover:text-zinc-700">
            Ver pedidos
          </Link>
        </p>
      </AdminShell>
    </RequireAdmin>
  );
}
