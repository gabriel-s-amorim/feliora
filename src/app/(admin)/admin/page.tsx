"use client";

import {
  ArrowUpRight,
  ImageIcon,
  Package,
  Plus,
  Sparkles,
  Tags,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell, RequireAdmin } from "@/components/admin/AdminShell";
import { AdminButton, AdminPanel, AdminSpinner } from "@/components/admin/ui";
import {
  adminListBanners,
  adminListCategories,
  adminListProducts,
} from "@/lib/admin/client";

export default function AdminDashboardPage() {
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

  const cards = [
    {
      label: "Produtos",
      value: stats.products,
      href: "/admin/produtos",
      icon: Package,
      hint: "Catálogo completo",
    },
    {
      label: "Ativos na loja",
      value: stats.activeProducts,
      href: "/admin/produtos",
      icon: Sparkles,
      hint: "Visíveis no site",
    },
    {
      label: "Categorias",
      value: stats.categories,
      href: "/admin/categorias",
      icon: Tags,
      hint: "Organização",
    },
    {
      label: "Banners",
      value: stats.banners,
      href: "/admin/banners",
      icon: ImageIcon,
      hint: "Home / vitrine",
    },
  ];

  return (
    <RequireAdmin>
      <AdminShell
        title="Dashboard"
        description="Visão rápida do catálogo e atalhos para o dia a dia."
        actions={
          <Link href="/admin/produtos/novo">
            <AdminButton>
              <Plus className="size-4" />
              Novo produto
            </AdminButton>
          </Link>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.label}
                href={card.href}
                className="admin-panel group p-5 transition hover:border-zinc-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                      {card.label}
                    </p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
                      {loading ? <AdminSpinner className="mt-2" /> : card.value}
                    </p>
                    <p className="mt-2 text-xs text-zinc-500">{card.hint}</p>
                  </div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                    <Icon className="size-4" />
                  </span>
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-zinc-400 transition group-hover:text-zinc-700">
                  Abrir
                  <ArrowUpRight className="size-3.5" />
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
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
      </AdminShell>
    </RequireAdmin>
  );
}
