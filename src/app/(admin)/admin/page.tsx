"use client";

import {
  ArrowUpRight,
  ImageIcon,
  Package,
  Plus,
  ShoppingBag,
  Sparkles,
  Tags,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell, RequireAdmin } from "@/components/admin/AdminShell";
import { AdminButton, AdminPanel, AdminSpinner } from "@/components/admin/ui";
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

  const cards = [
    {
      label: "Produtos",
      value: stats.products,
      href: "/admin/produtos",
      icon: Package,
      hint: "No catálogo",
    },
    {
      label: "Ativos",
      value: stats.activeProducts,
      href: "/admin/produtos",
      icon: Sparkles,
      hint: "Visíveis na loja",
    },
    {
      label: "Categorias",
      value: stats.categories,
      href: "/admin/categorias",
      icon: Tags,
      hint: "Seções",
    },
    {
      label: "Banners",
      value: stats.banners,
      href: "/admin/banners",
      icon: ImageIcon,
      hint: "Vitrine",
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
      href: "/admin/categorias",
      label: "Categorias",
      icon: Tags,
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
        description="Visão rápida do catálogo e atalhos para o dia a dia."
        actions={
          <Link href="/admin/produtos/novo" className="hidden sm:block">
            <AdminButton>
              <Plus className="size-4" />
              Novo produto
            </AdminButton>
          </Link>
        }
      >
        {/* Mobile greeting */}
        <section className="mb-5 lg:hidden">
          <p className="text-sm text-zinc-500">Olá, {firstName}</p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-zinc-950">
            O que vamos cuidar hoje?
          </p>
        </section>

        {/* Quick actions — app style */}
        <section className="mb-5 lg:hidden">
          <div className="grid grid-cols-2 gap-2.5">
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
        </section>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.label}
                href={card.href}
                className="admin-stat-card group p-4 transition active:bg-zinc-50 sm:p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400 sm:text-[11px]">
                      {card.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 sm:mt-3 sm:text-3xl">
                      {loading ? (
                        <AdminSpinner className="mt-1" />
                      ) : (
                        card.value
                      )}
                    </p>
                    <p className="mt-1 hidden text-xs text-zinc-500 sm:mt-2 sm:block">
                      {card.hint}
                    </p>
                  </div>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 sm:size-9">
                    <Icon className="size-3.5 sm:size-4" />
                  </span>
                </div>
                <span className="mt-3 hidden items-center gap-1 text-xs font-medium text-zinc-400 transition group-hover:text-zinc-700 sm:mt-4 sm:inline-flex">
                  Abrir
                  <ArrowUpRight className="size-3.5" />
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-5 hidden gap-4 lg:mt-6 lg:grid lg:grid-cols-[1.2fr_0.8fr]">
          <AdminPanel
            title="Comece por aqui"
            description="Fluxo sugerido para popular a loja."
          >
            <ol className="space-y-2.5">
              {[
                {
                  step: "01",
                  title: "Categorias",
                  text: "Organize Vestidos, Blusas e demais seções.",
                  href: "/admin/categorias",
                },
                {
                  step: "02",
                  title: "Produtos + variantes",
                  text: "Cadastre peças com matriz tamanho × cor e estoque.",
                  href: "/admin/produtos/novo",
                },
                {
                  step: "03",
                  title: "Banners",
                  text: "Atualize a vitrine da home com imagens WebP.",
                  href: "/admin/banners",
                },
              ].map((item) => (
                <Link
                  key={item.step}
                  href={item.href}
                  className="flex items-start gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3.5 transition hover:border-zinc-300 hover:bg-zinc-50"
                >
                  <span className="text-sm font-semibold text-zinc-400">
                    {item.step}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium text-zinc-950">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block text-sm text-zinc-500">
                      {item.text}
                    </span>
                  </span>
                </Link>
              ))}
            </ol>
          </AdminPanel>

          <AdminPanel title="Atalhos" description="Ações frequentes.">
            <div className="flex flex-col gap-2">
              <Link href="/admin/produtos">
                <AdminButton
                  variant="secondary"
                  className="w-full justify-between"
                >
                  Ver produtos
                  <ArrowUpRight className="size-4" />
                </AdminButton>
              </Link>
              <Link href="/admin/banners">
                <AdminButton
                  variant="secondary"
                  className="w-full justify-between"
                >
                  Gerir banners
                  <ArrowUpRight className="size-4" />
                </AdminButton>
              </Link>
              <Link href="/admin/settings">
                <AdminButton
                  variant="secondary"
                  className="w-full justify-between"
                >
                  Contato & redes
                  <ArrowUpRight className="size-4" />
                </AdminButton>
              </Link>
              <a href="/" target="_blank" rel="noreferrer">
                <AdminButton variant="ghost" className="w-full justify-between">
                  Abrir loja
                  <ArrowUpRight className="size-4" />
                </AdminButton>
              </a>
            </div>
          </AdminPanel>
        </div>

        {/* Mobile: compact next steps */}
        <section className="mt-5 lg:hidden">
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
            Próximos passos
          </p>
          <div className="overflow-hidden rounded-[1.15rem] border border-zinc-200 bg-white shadow-[var(--admin-shadow)]">
            {[
              {
                title: "Categorias",
                text: "Organize as seções da loja",
                href: "/admin/categorias",
              },
              {
                title: "Produtos",
                text: "Cadastre peças e estoque",
                href: "/admin/produtos",
              },
              {
                title: "Banners",
                text: "Atualize a vitrine",
                href: "/admin/banners",
              },
            ].map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between gap-3 px-4 py-3.5 active:bg-zinc-50 ${
                  i > 0 ? "border-t border-zinc-100" : ""
                }`}
              >
                <span>
                  <span className="block text-sm font-medium text-zinc-950">
                    {item.title}
                  </span>
                  <span className="block text-xs text-zinc-500">{item.text}</span>
                </span>
                <ArrowUpRight className="size-4 shrink-0 text-zinc-400" />
              </Link>
            ))}
          </div>
        </section>
      </AdminShell>
    </RequireAdmin>
  );
}
