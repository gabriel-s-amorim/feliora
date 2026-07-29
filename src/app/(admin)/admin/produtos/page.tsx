"use client";

import { Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminShell, RequireAdmin } from "@/components/admin/AdminShell";
import { TikTokImportModal } from "@/components/admin/TikTokImportModal";
import {
  AdminAlert,
  AdminBadge,
  AdminButton,
  AdminEmpty,
  AdminInput,
  AdminSpinner,
} from "@/components/admin/ui";
import {
  AdminApiError,
  adminDeleteProduct,
  adminListProducts,
} from "@/lib/admin/client";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/shared/types/product";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [importOpen, setImportOpen] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setProducts(await adminListProducts());
    } catch (err) {
      setError(
        err instanceof AdminApiError ? err.message : "Erro ao carregar produtos"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.category?.name?.toLowerCase().includes(q)
    );
  }, [products, query]);

  async function handleDelete(product: Product) {
    if (!confirm(`Excluir "${product.name}"?`)) return;
    try {
      await adminDeleteProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err) {
      alert(err instanceof AdminApiError ? err.message : "Falha ao excluir");
    }
  }

  return (
    <RequireAdmin>
      <AdminShell
        title="Produtos"
        description="Gerencie peças, imagens, preços e a matriz de variantes."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <AdminButton
              variant="secondary"
              className="!px-3 sm:!px-4"
              onClick={() => setImportOpen(true)}
            >
              <Upload className="size-4" />
              <span className="sm:hidden">TikTok</span>
              <span className="hidden sm:inline">Importar do TikTok</span>
            </AdminButton>
            <Link href="/admin/produtos/novo">
              <AdminButton className="!px-3 sm:!px-4">
                <Plus className="size-4" />
                <span className="sm:hidden">Novo</span>
                <span className="hidden sm:inline">Novo produto</span>
              </AdminButton>
            </Link>
          </div>
        }
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md sm:flex-1">
            <Search className="admin-input-icon" aria-hidden />
            <AdminInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome, slug ou categoria…"
              className="admin-input-icon-left"
            />
          </div>
          <p className="text-sm text-[var(--admin-muted)]">
            {loading ? "…" : `${filtered.length} produto(s)`}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-[var(--admin-muted)]">
            <AdminSpinner />
            Carregando produtos…
          </div>
        ) : error ? (
          <AdminAlert>{error}</AdminAlert>
        ) : filtered.length === 0 ? (
          <AdminEmpty
            title={query ? "Nenhum resultado" : "Nenhum produto ainda"}
            description={
              query
                ? "Tente outro termo de busca."
                : "Cadastre a primeira peça com variantes e estoque."
            }
            action={
              !query ? (
                <Link href="/admin/produtos/novo">
                  <AdminButton>
                    <Plus className="size-4" />
                    Criar produto
                  </AdminButton>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Mobile: cards */}
            <ul className="space-y-3 md:hidden">
              {filtered.map((product) => (
                <li
                  key={product.id}
                  className="rounded-[var(--admin-radius)] border border-[var(--admin-line)] bg-[var(--admin-surface)] p-3 shadow-[var(--admin-shadow)]"
                >
                  <div className="flex gap-3">
                    <div className="h-20 w-16 shrink-0 overflow-hidden rounded-xl border border-[var(--admin-line)] bg-[var(--admin-surface-2)]">
                      {product.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.image}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[var(--admin-ink)]">
                            {product.name}
                          </p>
                          <p className="truncate text-xs text-[var(--admin-muted)]">
                            /{product.slug}
                          </p>
                        </div>
                        <AdminBadge
                          tone={product.isActive ? "success" : "muted"}
                        >
                          {product.isActive ? "Ativo" : "Inativo"}
                        </AdminBadge>
                      </div>
                      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                        <div>
                          <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
                            Categoria
                          </dt>
                          <dd className="truncate text-[var(--admin-ink)]">
                            {product.category?.name ?? "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
                            Preço
                          </dt>
                          <dd className="font-medium text-[var(--admin-ink)]">
                            {formatPrice(product.price)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
                            Estoque
                          </dt>
                          <dd className="text-[var(--admin-ink)]">
                            {product.stockCount}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2 border-t border-[var(--admin-line)] pt-3">
                    <Link
                      href={`/admin/produtos/${product.id}`}
                      className="min-w-0 flex-1"
                    >
                      <AdminButton
                        variant="secondary"
                        className="w-full !px-3"
                      >
                        <Pencil className="size-4 shrink-0" />
                        Editar
                      </AdminButton>
                    </Link>
                    <AdminButton
                      variant="danger"
                      className="!px-3"
                      onClick={() => handleDelete(product)}
                      aria-label={`Excluir ${product.name}`}
                    >
                      <Trash2 className="size-4" />
                    </AdminButton>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop: table */}
            <div className="admin-table-wrap hidden overflow-x-auto md:block">
              <table className="admin-table min-w-[720px]">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Categoria</th>
                    <th>Preço</th>
                    <th>Estoque</th>
                    <th>Status</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-11 overflow-hidden rounded-xl border border-[var(--admin-line)] bg-[var(--admin-surface-2)]">
                            {product.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.image}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-[var(--admin-ink)]">
                              {product.name}
                            </p>
                            <p className="truncate text-xs text-[var(--admin-muted)]">
                              /{product.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="text-[var(--admin-muted)]">
                        {product.category?.name ?? "—"}
                      </td>
                      <td className="font-medium">
                        {formatPrice(product.price)}
                      </td>
                      <td>{product.stockCount}</td>
                      <td>
                        <AdminBadge
                          tone={product.isActive ? "success" : "muted"}
                        >
                          {product.isActive ? "Ativo" : "Inativo"}
                        </AdminBadge>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/admin/produtos/${product.id}`}>
                            <AdminButton variant="ghost" className="!px-2.5">
                              <Pencil className="size-4" />
                              Editar
                            </AdminButton>
                          </Link>
                          <AdminButton
                            variant="danger"
                            className="!px-2.5"
                            onClick={() => handleDelete(product)}
                          >
                            <Trash2 className="size-4" />
                          </AdminButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </AdminShell>

      <TikTokImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onDone={() => void load()}
      />
    </RequireAdmin>
  );
}
