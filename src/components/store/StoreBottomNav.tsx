"use client";

import {
  Bell,
  Heart,
  Home,
  LayoutGrid,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useUnreadStoreNotifications } from "@/hooks/useUnreadStoreNotifications";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Início", icon: Home, exact: true },
  { href: "/catalogo", label: "Catálogo", icon: LayoutGrid },
  { href: "/favoritos", label: "Favoritos", icon: Heart, badge: "wish" as const },
  {
    href: "/notificacoes",
    label: "Notificações",
    icon: Bell,
    badge: "notif" as const,
    auth: true,
  },
  { href: "/conta", label: "Eu", icon: UserRound, account: true },
] as const;

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Páginas onde a tab bar atrapalha (checkout / PDP com sticky CTA) */
function hideTabBar(pathname: string) {
  if (pathname.startsWith("/checkout")) return true;
  if (pathname.startsWith("/produto/")) return true;
  if (pathname === "/carrinho") return true;
  if (
    pathname.startsWith("/conta/entrar") ||
    pathname.startsWith("/conta/cadastro") ||
    pathname.startsWith("/conta/criar")
  ) {
    return true;
  }
  return false;
}

export function StoreBottomNav() {
  const pathname = usePathname();
  const { count: wishCount } = useWishlist();
  const { user } = useCustomerAuth();
  const { unreadCount: notifBadge } = useUnreadStoreNotifications();

  if (hideTabBar(pathname)) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-cream/95 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navegação da loja"
    >
      <div className="mx-auto flex max-w-lg items-stretch px-0.5 pt-1">
        {TABS.map((tab) => {
          const href =
            "account" in tab && tab.account
              ? user
                ? "/conta"
                : "/conta/entrar"
              : "auth" in tab && tab.auth
                ? user
                  ? tab.href
                  : `/conta/entrar?next=${encodeURIComponent(tab.href)}`
                : tab.href;
          const active =
            "account" in tab && tab.account
              ? pathname.startsWith("/conta") &&
                !pathname.startsWith("/conta/entrar") &&
                !pathname.startsWith("/conta/cadastro")
              : isActive(pathname, tab.href, "exact" in tab ? tab.exact : false);
          const Icon = tab.icon;
          let badge = 0;
          if ("badge" in tab && tab.badge === "wish" && wishCount > 0) {
            badge = wishCount;
          } else if ("badge" in tab && tab.badge === "notif" && notifBadge > 0) {
            badge = notifBadge;
          }

          return (
            <Link
              key={tab.label}
              href={href}
              className={cn(
                "relative flex min-h-[3.35rem] flex-1 flex-col items-center justify-center gap-0.5 transition-colors",
                active ? "text-rose-gold" : "text-ink-muted"
              )}
            >
              <span className="relative">
                <Icon className="size-[1.15rem]" strokeWidth={1.5} />
                {badge > 0 ? (
                  <span className="absolute -right-2 -top-1.5 flex size-3.5 items-center justify-center rounded-full bg-rose-gold text-[8px] text-cream">
                    {badge > 9 ? "9+" : badge}
                  </span>
                ) : null}
              </span>
              <span className="text-[9px] tracking-[0.04em]">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
