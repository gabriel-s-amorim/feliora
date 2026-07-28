"use client";

import {
  ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Plug,
  Settings2,
  ShoppingBag,
  Store,
  Tags,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AdminSpinner } from "@/components/admin/ui";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/shared/const/site";
import "@/styles/admin.css";

const NAV = [
  {
    href: "/admin",
    label: "Dashboard",
    exact: true,
    icon: LayoutDashboard,
  },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { href: "/admin/categorias", label: "Categorias", icon: Tags },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  { href: "/admin/integracoes", label: "Integrações", icon: Plug },
  { href: "/admin/settings", label: "Settings", icon: Settings2 },
] as const;

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
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
      {NAV.map((item) => {
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
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await logout();
    router.replace("/admin/login");
  }

  return (
    <div className="admin-app">
      <div className="flex min-h-dvh w-full">
        {/* Desktop sidebar — full height, edge-to-edge */}
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col bg-zinc-950 px-3 py-5 text-zinc-100 lg:flex xl:w-64">
          <Link href="/admin" className="mb-8 flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-sm font-bold tracking-tight text-zinc-950">
              F
            </div>
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

        {/* Mobile drawer */}
        {mobileOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/50"
              aria-label="Fechar menu"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 flex w-[min(88vw,280px)] flex-col bg-zinc-950 px-3 py-5 text-zinc-100 shadow-2xl">
              <div className="mb-6 flex items-center justify-between px-2">
                <p className="text-sm font-semibold">{SITE_NAME} Admin</p>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
                >
                  <X className="size-5" />
                </button>
              </div>
              <NavLinks
                pathname={pathname}
                onNavigate={() => setMobileOpen(false)}
              />
              <SidebarFooter
                admin={
                  admin ? { name: admin.name, email: admin.email } : null
                }
                onLogout={handleLogout}
              />
            </aside>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col bg-white">
          <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 px-4 py-4 backdrop-blur-md sm:px-6 lg:px-8">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <button
                  type="button"
                  className="mt-0.5 rounded-lg border border-zinc-200 bg-white p-2 text-zinc-700 lg:hidden"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Abrir menu"
                >
                  <Menu className="size-5" />
                </button>
                <div className="min-w-0 admin-enter">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                    {SITE_NAME} · Admin
                  </p>
                  <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
                    {title}
                  </h1>
                  {description ? (
                    <p className="mt-1 max-w-2xl text-sm text-zinc-500">
                      {description}
                    </p>
                  ) : null}
                </div>
              </div>
              {actions ? (
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 admin-enter">
                  {actions}
                </div>
              ) : null}
            </div>
          </header>

          <main className="flex-1 bg-zinc-50/80 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            <div className="admin-enter admin-enter-delay-1">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
