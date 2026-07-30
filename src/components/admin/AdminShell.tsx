"use client";

import {
  Bell,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Package,
  Plug,
  Settings2,
  ShoppingBag,
  Store,
  Tags,
  TicketPercent,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";
import { AdminSpinner } from "@/components/admin/ui";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/shared/const/site";
import "@/styles/admin.css";

const SIDEBAR_NAV = [
  {
    href: "/admin",
    label: "Dashboard",
    exact: true,
    icon: LayoutDashboard,
  },
  { href: "/admin/notificacoes", label: "Notificações", icon: Bell },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/canais", label: "Canais", icon: Store },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/categorias", label: "Categorias", icon: Tags },
  { href: "/admin/cupons", label: "Cupons", icon: TicketPercent },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  { href: "/admin/integracoes", label: "Integrações", icon: Plug },
  { href: "/admin/settings", label: "Settings", icon: Settings2 },
] as const;

const BOTTOM_TABS = [
  {
    href: "/admin",
    label: "Início",
    exact: true,
    icon: LayoutDashboard,
  },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { href: "/admin/notificacoes", label: "Avisos", icon: Bell },
] as const;

const MORE_LINKS = [
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/canais", label: "Canais", icon: Store },
  { href: "/admin/categorias", label: "Categorias", icon: Tags },
  { href: "/admin/cupons", label: "Cupons", icon: TicketPercent },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  { href: "/admin/integracoes", label: "Integrações", icon: Plug },
  { href: "/admin/settings", label: "Settings", icon: Settings2 },
] as const;

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isMoreActive(pathname: string) {
  return MORE_LINKS.some((item) => isActive(pathname, item.href));
}

/** Formulários longos: esconde a tab bar para maximizar espaço */
function hideBottomNav(pathname: string) {
  if (pathname === "/admin/produtos/novo") return true;
  if (/^\/admin\/produtos\/[^/]+$/.test(pathname)) return true;
  if (/^\/admin\/pedidos\/[^/]+$/.test(pathname)) return true;
  if (/^\/admin\/clientes\/[^/]+$/.test(pathname)) return true;
  return false;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/admin/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="admin-app flex min-h-dvh items-center justify-center gap-3 text-sm text-[var(--admin-muted)]">
        <AdminSpinner />
        Preparando o painel…
      </div>
    );
  }

  if (!isAuthenticated) return null;
  return <>{children}</>;
}

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-0.5">
      {SIDEBAR_NAV.map((item) => {
        const active = isActive(
          pathname,
          item.href,
          "exact" in item ? item.exact : false
        );
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-white text-zinc-950"
                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
            )}
          >
            <Icon className={cn("size-4 shrink-0", active && "text-zinc-950")} />
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter({
  admin,
  onLogout,
}: {
  admin: { name: string; email: string } | null;
  onLogout: () => void;
}) {
  return (
    <div className="mt-auto space-y-2 border-t border-white/10 pt-4">
      <a
        href="/"
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100"
      >
        <Store className="size-4" />
        Ver loja
      </a>
      <div className="rounded-xl bg-white/5 px-3 py-3">
        <p className="truncate text-sm font-medium text-zinc-100">
          {admin?.name || "Admin"}
        </p>
        <p className="truncate text-xs text-zinc-500">{admin?.email}</p>
        <button
          type="button"
          onClick={onLogout}
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white"
        >
          <LogOut className="size-3.5" />
          Sair
        </button>
      </div>
    </div>
  );
}

function MoreSheet({
  open,
  onClose,
  pathname,
  admin,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
  admin: { name: string; email: string } | null;
  onLogout: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div className="admin-sheet absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-5 pb-2 pt-3">
          <div className="mx-auto h-1 w-10 rounded-full bg-zinc-200" aria-hidden />
        </div>
        <div className="flex items-center justify-between px-5 pb-3">
          <div>
            <p className="text-base font-semibold text-zinc-950">Mais</p>
            <p className="text-xs text-zinc-500">
              {admin?.name || "Admin"} · {SITE_NAME}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-zinc-100 p-2 text-zinc-600"
            aria-label="Fechar menu"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="grid grid-cols-2 gap-2">
            {MORE_LINKS.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex flex-col items-start gap-3 rounded-2xl border p-4 transition",
                    active
                      ? "border-zinc-900 bg-zinc-950 text-white"
                      : "border-zinc-200 bg-zinc-50 text-zinc-900 active:bg-zinc-100"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-xl",
                      active ? "bg-white/15" : "bg-white"
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-3 space-y-1 rounded-2xl border border-zinc-200 bg-zinc-50 p-2">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-zinc-800 active:bg-white"
            >
              <Store className="size-4 text-zinc-500" />
              Ver loja
            </a>
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 active:bg-white"
            >
              <LogOut className="size-4" />
              Sair
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { admin, logout } = useAdminAuth();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const showTabs = !hideBottomNav(pathname);
  const moreActive = isMoreActive(pathname);

  async function handleLogout() {
    await logout();
    router.replace("/admin/login");
  }

  return (
    <div className="admin-app">
      <div className="flex min-h-dvh w-full">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col bg-zinc-950 px-3 py-5 text-zinc-100 lg:flex xl:w-64">
          <Link href="/admin" className="mb-8 flex items-center gap-3 px-2">
            <Image
              src="/apple-icon.png"
              alt={SITE_NAME}
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg object-cover"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight">{SITE_NAME}</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                Admin
              </p>
            </div>
          </Link>

          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
            Menu
          </p>
          <NavLinks pathname={pathname} />
          <SidebarFooter
            admin={admin ? { name: admin.name, email: admin.email } : null}
            onLogout={handleLogout}
          />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-[var(--admin-bg)]">
          {/* Compact app header (mobile) / richer header (desktop) */}
          <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/92 backdrop-blur-md pt-[env(safe-area-inset-top)]">
            <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8 lg:py-4">
              <div className="min-w-0 flex-1 admin-enter">
                <p className="hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400 lg:block">
                  {SITE_NAME} · Admin
                </p>
                <div className="flex items-center gap-2 lg:mt-0.5">
                  <h1 className="truncate text-[1.35rem] font-semibold tracking-tight text-zinc-950 sm:text-2xl lg:text-3xl">
                    {title}
                  </h1>
                </div>
                {description ? (
                  <p className="mt-0.5 hidden max-w-2xl text-sm text-zinc-500 sm:line-clamp-1 lg:block">
                    {description}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-2 admin-enter">
                <AdminNotificationBell />
                {actions}
              </div>
            </div>
          </header>

          <main
            className={cn(
              "flex-1 px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8",
              showTabs
                ? "pb-[calc(5.25rem+env(safe-area-inset-bottom))] lg:pb-8"
                : "pb-[max(1rem,env(safe-area-inset-bottom))]"
            )}
          >
            <div className="admin-enter admin-enter-delay-1">{children}</div>
          </main>
        </div>
      </div>

      {/* Mobile bottom tab bar — bank / app style */}
      {showTabs ? (
        <nav
          className="admin-tabbar fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200/90 bg-white/95 backdrop-blur-xl lg:hidden"
          aria-label="Navegação principal"
        >
          <div className="mx-auto flex max-w-lg items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)] pt-1">
            {BOTTOM_TABS.map((tab) => {
              const active = isActive(
                pathname,
                tab.href,
                "exact" in tab ? tab.exact : false
              );
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "flex min-h-[3.25rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 transition",
                    active ? "text-zinc-950" : "text-zinc-400 active:text-zinc-700"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 items-center justify-center rounded-xl transition",
                      active && "bg-zinc-950 text-white"
                    )}
                  >
                    <Icon className="size-[1.15rem]" strokeWidth={active ? 2.25 : 1.75} />
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-medium tracking-wide",
                      active && "font-semibold"
                    )}
                  >
                    {tab.label}
                  </span>
                </Link>
              );
            })}

            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={cn(
                "flex min-h-[3.25rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 transition",
                moreActive || moreOpen
                  ? "text-zinc-950"
                  : "text-zinc-400 active:text-zinc-700"
              )}
            >
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-xl transition",
                  (moreActive || moreOpen) && "bg-zinc-950 text-white"
                )}
              >
                <MoreHorizontal
                  className="size-[1.15rem]"
                  strokeWidth={moreActive || moreOpen ? 2.25 : 1.75}
                />
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium tracking-wide",
                  (moreActive || moreOpen) && "font-semibold"
                )}
              >
                Mais
              </span>
            </button>
          </div>
        </nav>
      ) : null}

      <MoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        pathname={pathname}
        admin={admin ? { name: admin.name, email: admin.email } : null}
        onLogout={handleLogout}
      />
    </div>
  );
}
