"use client";

import {
  ArrowUpRight,
  ImageIcon,
  Package,
  Plus,
  ShoppingBag,
  Tags,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminAnalyticsDashboard } from "@/components/admin/AdminAnalyticsDashboard";
import { AdminShell, RequireAdmin } from "@/components/admin/AdminShell";
import { AdminButton, AdminSpinner } from "@/components/admin/ui";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import {
  adminListBanners,
  adminListCategories,
  adminListProducts,
} from "@/lib/admin/client";

export default function AdminDashboardPage() {
  const { admin } = useAdminAuth();
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    banners: 0,
    activeProducts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [products, categories, banners] = await Promise.all([
          adminListProducts(),
          adminListCategories(),
          adminListBanners(),
        ]);
        if (cancelled) return;
        setStats({
          products: products.length,
          categories: categories.length,
          banners: banners.length,
          activeProducts: products.filter((p) => p.isActive).length,
        });
      } catch {
        /* empty */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const firstName = admin?.name?.split(" ")[0] || "Admin";

  const catalogCards = [
    {
      label: "Produtos",
      value: stats.products,
      href: "/admin/produtos",
      icon: Package,
    },
    {
      label: "Ativos",
      value: stats.activeProducts,
      href: "/admin/produtos",
      icon: Package,
    },
    {
      label: "Categorias",
      value: stats.categories,
      href: "/admin/categorias",
      icon: Tags,
    },
    {
      label: "Banners",
      value: stats.banners,
      href: "/admin/banners",
      icon: ImageIcon,
    },
  ];

  const quickActions = [
    {
      href: "/admin/produtos/novo",
      label: "Novo produto",
      icon: Plus,
      primary: true,
    },
    {
      href: "/admin/pedidos",
      label: "Pedidos",
      icon: ShoppingBag,
    },
    {
      href: "/admin/clientes",
      label: "Clientes",
      icon: Users,
    },
    {
      href: "/admin/banners",
      label: "Banners",
      icon: ImageIcon,
    },
  ];

  return (
    <RequireAdmin>
      <AdminShell
        title="Início"
        description="Acessos da loja em tempo real e visão rápida do catálogo."
        actions={
          <Link href="/admin/produtos/novo" className="hidden sm:block">
            <AdminButton>
              <Plus className="size-4" />
              Novo produto
            </AdminButton>
          </Link>
        }
      >
        <section className="mb-4 lg:hidden">
          <p className="text-sm text-zinc-500">Olá, {firstName}</p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-zinc-950">
            Como está a loja hoje?
          </p>
        </section>

        <AdminAnalyticsDashboard />

        <section className="mt-6 lg:mt-8">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-950 sm:text-base">
                Catálogo
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Atalhos e números do inventário
              </p>
            </div>
            <Link
              href="/admin/produtos"
              className="hidden text-xs font-medium text-zinc-500 hover:text-zinc-900 sm:inline-flex sm:items-center sm:gap-1"
            >
              Ver tudo
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2.5 sm:hidden">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className={
                    action.primary
                      ? "flex flex-col items-start gap-3 rounded-[1.1rem] bg-zinc-950 p-4 text-white shadow-[var(--admin-shadow)]"
                      : "admin-quick-action"
                  }
                >
                  <span
                    className={
                      action.primary
                        ? "flex size-9 items-center justify-center rounded-xl bg-white/15"
                        : "flex size-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800"
                    }
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="text-sm font-medium">{action.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
            {catalogCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.label}
                  href={card.href}
                  className="admin-stat-card group p-3.5 transition active:bg-zinc-50 sm:p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                        {card.label}
                      </p>
                      <p className="mt-1.5 text-xl font-semibold tracking-tight text-zinc-950 sm:text-2xl">
                        {loading ? <AdminSpinner /> : card.value}
                      </p>
                    </div>
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                      <Icon className="size-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </AdminShell>
    </RequireAdmin>
  );
}
