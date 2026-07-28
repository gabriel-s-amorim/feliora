"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminShell, RequireAdmin } from "@/components/admin/AdminShell";
import {
  AdminAlert,
  AdminBadge,
  AdminButton,
  AdminEmpty,
  AdminField,
  AdminInput,
  AdminPanel,
  AdminSpinner,
  AdminTextarea,
} from "@/components/admin/ui";
import {
  AdminApiError,
  adminCreateCategory,
  adminDeleteCategory,
  adminListCategories,
  adminUpdateCategory,
} from "@/lib/admin/client";
import { slugify } from "@/shared/lib/slugify";
import type { Category } from "@/shared/types/category";

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  sortOrder: "0",
  isActive: true,
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setCategories(await adminListCategories());
    } catch (err) {
      setError(
        err instanceof AdminApiError
          ? err.message
          : "Erro ao carregar categorias"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(category: Category) {
    setEditingId(category.id);
    setSlugTouched(true);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description,
      sortOrder: String(category.sortOrder),
      isActive: category.isActive,
    });
  }

  function resetForm() {
    setEditingId(null);
    setSlugTouched(false);
    setForm(emptyForm);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      description: form.description,
      seoTitle: "",
      seoDescription: "",
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    };

    try {
      if (editingId) {
        await adminUpdateCategory(editingId, payload);
      } else {
        await adminCreateCategory(payload);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(
        err instanceof AdminApiError ? err.message : "Erro ao salvar categoria"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category: Category) {
    if (!confirm(`Excluir categoria "${category.name}"?`)) return;
    try {
      await adminDeleteCategory(category.id);
      await load();
    } catch (err) {
      alert(err instanceof AdminApiError ? err.message : "Falha ao excluir");
    }
  }

  return (
    <RequireAdmin>
      <AdminShell
        title="Categorias"
        description="Organize o catálogo em seções navegáveis da loja."
      >
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-[var(--admin-muted)]">
                <AdminSpinner />
                Carregando…
              </div>
            ) : categories.length === 0 ? (
              <AdminEmpty
                title="Nenhuma categoria"
                description="Crie a primeira para organizar os produtos."
              />
            ) : (
              <div className="admin-table-wrap overflow-hidden">
                <ul className="divide-y divide-[var(--admin-line)]">
                  {categories.map((category) => (
                    <li
                      key={category.id}
                      className="flex items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-[rgba(183,110,121,0.04)]"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-[var(--admin-ink)]">
                            {category.name}
                          </p>
                          <AdminBadge
                            tone={category.isActive ? "success" : "muted"}
                          >
                            {category.isActive ? "Ativa" : "Inativa"}
                          </AdminBadge>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-[var(--admin-muted)]">
                          /{category.slug} · ordem {category.sortOrder}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <AdminButton
                          type="button"
                          variant="ghost"
                          className="!px-2.5"
                          onClick={() => startEdit(category)}
                        >
                          <Pencil className="size-4" />
                        </AdminButton>
                        <AdminButton
                          type="button"
                          variant="danger"
                          className="!px-2.5"
                          onClick={() => handleDelete(category)}
                        >
                          <Trash2 className="size-4" />
                        </AdminButton>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <AdminPanel
            title={editingId ? "Editar categoria" : "Nova categoria"}
            description="Slug em kebab-case, usado nas URLs da loja."
          >
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <AdminField label="Nome">
                <AdminInput
                  required
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm((f) => ({
                      ...f,
                      name,
                      slug: slugTouched ? f.slug : slugify(name),
                    }));
                  }}
                />
              </AdminField>
              <AdminField label="Slug">
                <AdminInput
                  required
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setForm((f) => ({ ...f, slug: e.target.value }));
                  }}
                />
              </AdminField>
              <AdminField label="Descrição">
                <AdminTextarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </AdminField>
              <AdminField label="Ordem">
                <AdminInput
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sortOrder: e.target.value }))
                  }
                />
              </AdminField>
              <label className="inline-flex items-center gap-2 text-sm text-[var(--admin-ink)]">
                <input
                  type="checkbox"
                  className="accent-[var(--admin-accent)]"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isActive: e.target.checked }))
                  }
                />
                Categoria ativa
              </label>

              {error ? <AdminAlert>{error}</AdminAlert> : null}

              <div className="flex flex-wrap gap-2 pt-1">
                <AdminButton type="submit" disabled={saving}>
                  {saving ? <AdminSpinner /> : <Plus className="size-4" />}
                  {saving ? "Salvando…" : "Salvar"}
                </AdminButton>
                {editingId ? (
                  <AdminButton
                    type="button"
                    variant="ghost"
                    onClick={resetForm}
                  >
                    Cancelar
                  </AdminButton>
                ) : null}
              </div>
            </form>
          </AdminPanel>
        </div>
      </AdminShell>
    </RequireAdmin>
  );
}
