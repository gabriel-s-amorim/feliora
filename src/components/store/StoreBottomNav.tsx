"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { cn } from "@/lib/utils";

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" strokeLinejoin="round" />
    </svg>
  );
}

function IconGrid({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <rect x="13" y="4" width="7" height="7" rx="1" />
      <rect x="4" y="13" width="7" height="7" rx="1" />
      <rect x="13" y="13" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconHeart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path
        d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19a7 7 0 0 1 14 0" strokeLinecap="round" />
    </svg>
  );
}

const TABS = [
  { href: "/", label: "Início", icon: IconHome, exact: true },
  { href: "/catalogo", label: "Catálogo", icon: IconGrid },
  { href: "/favoritos", label: "Favoritos", icon: IconHeart, badge: "wish" as const },
  { href: "/conta", label: "Conta", icon: IconUser, account: true },
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
  if (pathname.startsWith("/conta/entrar") || pathname.startsWith("/conta/criar"))
    return true;
  return false;
}

export function StoreBottomNav() {
  const pathname = usePathname();
  const { count: wishCount } = useWishlist();
  const { user } = useCustomerAuth();

  if (hideTabBar(pathname)) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-cream/95 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navegação da loja"
    >
      <div className="mx-auto flex max-w-lg items-stretch px-1 pt-1">
        {TABS.map((tab) => {
          const href =
            "account" in tab && tab.account
              ? user
                ? "/conta"
                : "/conta/entrar"
              : tab.href;
          const active =
            "account" in tab && tab.account
              ? pathname.startsWith("/conta")
              : isActive(pathname, tab.href, "exact" in tab ? tab.exact : false);
          const Icon = tab.icon;
          const badge =
            "badge" in tab && tab.badge === "wish" && wishCount > 0
              ? wishCount
              : 0;

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
                <Icon className="size-5" />
                {badge > 0 ? (
                  <span className="absolute -right-2 -top-1.5 flex size-3.5 items-center justify-center rounded-full bg-rose-gold text-[8px] text-cream">
                    {badge > 9 ? "9+" : badge}
                  </span>
                ) : null}
              </span>
              <span className="text-[10px] tracking-[0.06em]">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
