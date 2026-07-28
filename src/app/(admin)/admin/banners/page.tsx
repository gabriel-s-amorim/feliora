"use client";

import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminShell, RequireAdmin } from "@/components/admin/AdminShell";
import { ImageUploader } from "@/components/admin/ImageUploader";
import {
  AdminAlert,
  AdminBadge,
  AdminButton,
  AdminEmpty,
  AdminField,
  AdminInput,
  AdminPanel,
  AdminSpinner,
} from "@/components/admin/ui";
import {
  AdminApiError,
  adminCreateBanner,
  adminDeleteBanner,
  adminListBanners,
  adminReorderBanners,
  adminUpdateBanner,
} from "@/lib/admin/client";
import type { Banner } from "@/shared/types/banner";

const emptyForm = {
  title: "",
  altText: "Banner Feliora",
  imageUrl: "",
  imageUrlMobile: "",
  linkUrl: "",
  objectPosition: "center center",
  isActive: true,
};

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      setBanners(await adminListBanners());
    } catch (err) {
      setError(
        err instanceof AdminApiError ? err.message : "Erro ao carregar banners"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(banner: Banner) {
    setEditingId(banner.id);
    setForm({
      title: banner.title,
      altText: banner.altText,
      imageUrl: banner.imageUrl,
      imageUrlMobile: banner.imageUrlMobile ?? "",
      linkUrl: banner.linkUrl ?? "",
      objectPosition: banner.objectPosition,
      isActive: banner.isActive,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      title: form.title,
      altText: form.altText,
      imageUrl: form.imageUrl,
      imageUrlMobile: form.imageUrlMobile || null,
      linkUrl: form.linkUrl || null,
      objectPosition: form.objectPosition,
      objectPositionMobile: form.objectPosition,
      isActive: form.isActive,
    };

    try {
      if (editingId) {
        await adminUpdateBanner(editingId, payload);
      } else {
        await adminCreateBanner(payload);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(
        err instanceof AdminApiError ? err.message : "Erro ao salvar banner"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(banner: Banner) {
    if (!confirm(`Excluir banner "${banner.title || banner.altText}"?`)) return;
    try {
      await adminDeleteBanner(banner.id);
      await load();
    } catch (err) {
      alert(err instanceof AdminApiError ? err.message : "Falha ao excluir");
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= banners.length) return;
    const ordered = [...banners];
    const [item] = ordered.splice(index, 1);
    ordered.splice(nextIndex, 0, item);
    setBanners(ordered);
    try {
      await adminReorderBanners(ordered.map((b) => b.id));
    } catch (err) {
      alert(
        err instanceof AdminApiError ? err.message : "Falha ao reordenar"
      );
      await load();
    }
  }

  return (
    <RequireAdmin>
      <AdminShell
        title="Banners"
        description="Vitrine da home — desktop, mobile e ordem de exibição."
      >
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-[var(--admin-muted)]">
                <AdminSpinner />
                Carregando…
              </div>
            ) : banners.length === 0 ? (
              <AdminEmpty
                title="Nenhum banner"
                description="Envie a primeira imagem da vitrine."
              />
            ) : (
              banners.map((banner, index) => (
                <article
                  key={banner.id}
                  className="admin-panel overflow-hidden !p-0"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={banner.imageUrl}
                    alt={banner.altText}
                    className="h-40 w-full object-cover"
                    style={{ objectPosition: banner.objectPosition }}
                  />
                  <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium text-[var(--admin-ink)]">
                          {banner.title || banner.altText}
                        </p>
                        <AdminBadge
                          tone={banner.isActive ? "success" : "muted"}
                        >
                          {banner.isActive ? "Ativo" : "Inativo"}
                        </AdminBadge>
                      </div>
                      {banner.linkUrl ? (
                        <p className="mt-0.5 truncate text-xs text-[var(--admin-muted)]">
                          {banner.linkUrl}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <AdminButton
                        type="button"
                        variant="ghost"
                        className="!px-2"
                        onClick={() => move(index, -1)}
                      >
                        <ArrowUp className="size-4" />
                      </AdminButton>
                      <AdminButton
                        type="button"
                        variant="ghost"
                        className="!px-2"
                        onClick={() => move(index, 1)}
                      >
                        <ArrowDown className="size-4" />
                      </AdminButton>
                      <AdminButton
                        type="button"
                        variant="ghost"
                        className="!px-2"
                        onClick={() => startEdit(banner)}
                      >
                        <Pencil className="size-4" />
                      </AdminButton>
                      <AdminButton
                        type="button"
                        variant="danger"
                        className="!px-2"
                        onClick={() => handleDelete(banner)}
                      >
                        <Trash2 className="size-4" />
                      </AdminButton>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>

          <AdminPanel
            title={editingId ? "Editar banner" : "Novo banner"}
            description="Imagens são convertidas para WebP no upload."
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <ImageUploader
                folder="banners"
                multiple={false}
                label="Imagem desktop"
                urls={form.imageUrl ? [form.imageUrl] : []}
                onChange={(urls) =>
                  setForm((f) => ({ ...f, imageUrl: urls[0] ?? "" }))
                }
              />
              <ImageUploader
                folder="banners"
                multiple={false}
                label="Imagem mobile (opcional)"
                urls={form.imageUrlMobile ? [form.imageUrlMobile] : []}
                onChange={(urls) =>
                  setForm((f) => ({ ...f, imageUrlMobile: urls[0] ?? "" }))
                }
              />
              <AdminField label="Título interno">
                <AdminInput
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                />
              </AdminField>
              <AdminField label="Alt text">
                <AdminInput
                  required
                  value={form.altText}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, altText: e.target.value }))
                  }
                />
              </AdminField>
              <AdminField label="Link (opcional)">
                <AdminInput
                  value={form.linkUrl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, linkUrl: e.target.value }))
                  }
                  placeholder="/catalogo"
                />
              </AdminField>
              <AdminField label="Object position">
                <AdminInput
                  value={form.objectPosition}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, objectPosition: e.target.value }))
                  }
                />
              </AdminField>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="accent-[var(--admin-accent)]"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isActive: e.target.checked }))
                  }
                />
                Banner ativo
              </label>

              {error ? <AdminAlert>{error}</AdminAlert> : null}

              <div className="flex flex-wrap gap-2">
                <AdminButton
                  type="submit"
                  disabled={saving || !form.imageUrl}
                >
                  {saving ? <AdminSpinner /> : null}
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
