"use client";

import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ImageUploader } from "@/components/admin/ImageUploader";
import {
  VariantMatrix,
  type VariantDraft,
} from "@/components/admin/VariantMatrix";
import {
  AdminAlert,
  AdminButton,
  AdminField,
  AdminInput,
  AdminPanel,
  AdminSelect,
  AdminSpinner,
  AdminTextarea,
} from "@/components/admin/ui";
import {
  AdminApiError,
  adminCreateProduct,
  adminListCategories,
  adminUpdateProduct,
} from "@/lib/admin/client";
import { slugify } from "@/shared/lib/slugify";
import type { Category } from "@/shared/types/category";
import type { Product } from "@/shared/types/product";

type Props = {
  mode: "create" | "edit";
  initial?: Product;
};

type ColorDraft = { name: string; hex: string };

export function ProductForm({ mode, initial }: Props) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [categoryId, setCategoryId] = useState<string>(
    initial?.categoryId ?? ""
  );
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [originalPrice, setOriginalPrice] = useState(
    initial?.originalPrice != null ? String(initial.originalPrice) : ""
  );
  const [images, setImages] = useState<string[]>(
    initial
      ? [
          initial.image,
          ...initial.images.filter((u) => u !== initial.image),
        ].filter(Boolean)
      : []
  );
  const [badge, setBadge] = useState(initial?.badge ?? "");
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [isNew, setIsNew] = useState(initial?.isNew ?? false);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [shortDescription, setShortDescription] = useState(
    initial?.shortDescription ?? ""
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [sizesText, setSizesText] = useState(
    (initial?.sizes ?? []).map((s) => s.label).join(", ")
  );
  const [colors, setColors] = useState<ColorDraft[]>(
    initial?.colors?.length
      ? initial.colors
      : [{ name: "", hex: "#B76E79" }]
  );
  const [variants, setVariants] = useState<VariantDraft[]>(
    (initial?.variants ?? []).map((v) => ({
      sizeLabel: v.sizeLabel,
      colorName: v.colorName,
      sku: v.sku,
      stockCount: v.stockCount,
      isActive: v.isActive,
    }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    adminListCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const sizes = useMemo(
    () =>
      sizesText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [sizesText]
  );

  const colorNames = useMemo(
    () => colors.map((c) => c.name.trim()).filter(Boolean),
    [colors]
  );

  function onNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const cleanColors = colors
        .map((c) => ({ name: c.name.trim(), hex: c.hex }))
        .filter((c) => c.name);

      const payload = {
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        categoryId: categoryId || null,
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : null,
        image: images[0] ?? "",
        images: images.slice(1),
        badge,
        badgeColor: "#B76E79",
        featured,
        isNew,
        isActive,
        shortDescription,
        description,
        materials: [],
        careInstructions: [],
        sizes: sizes.map((label) => ({ label })),
        colors: cleanColors,
        faq: [],
        highlights: [],
        variants:
          variants.length > 0
            ? variants
            : sizes.map((sizeLabel) => ({
                sizeLabel,
                colorName: cleanColors[0]?.name ?? "",
                sku: `${slugify(name)}-${slugify(sizeLabel)}`.slice(0, 64),
                stockCount: 0,
                isActive: true,
              })),
      };

      if (payload.variants.length < 1) {
        throw new AdminApiError(
          "Informe tamanhos e gere ao menos uma variante",
          400
        );
      }

      if (mode === "create") {
        const created = await adminCreateProduct(payload);
        router.push(`/admin/produtos/${created.id}`);
        router.refresh();
      } else if (initial) {
        await adminUpdateProduct(initial.id, payload);
        router.refresh();
      }
    } catch (err) {
      setError(
        err instanceof AdminApiError
          ? err.message
          : "Não foi possível salvar o produto"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <AdminPanel
        title="Geral"
        description="Identidade, preço e visibilidade na loja."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Nome" className="sm:col-span-2">
            <AdminInput
              required
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Vestido Aurora"
            />
          </AdminField>
          <AdminField label="Slug">
            <AdminInput
              required
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
            />
          </AdminField>
          <AdminField label="Categoria">
            <AdminSelect
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <AdminField label="Preço (R$)">
            <AdminInput
              required
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </AdminField>
          <AdminField label="Preço original">
            <AdminInput
              type="number"
              min={0}
              step="0.01"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
            />
          </AdminField>
          <AdminField label="Badge" className="sm:col-span-2">
            <AdminInput
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              placeholder="Novo, Sale…"
            />
          </AdminField>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {(
            [
              ["featured", featured, setFeatured, "Destaque"],
              ["isNew", isNew, setIsNew, "Novidade"],
              ["isActive", isActive, setIsActive, "Ativo na loja"],
            ] as const
          ).map(([key, value, setter, label]) => (
            <label
              key={key}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition ${
                value
                  ? "border-[color-mix(in_srgb,var(--admin-accent)_40%,var(--admin-line))] bg-[var(--admin-accent-soft)] text-[var(--admin-ink)]"
                  : "border-[var(--admin-line)] bg-white/60 text-[var(--admin-muted)]"
              }`}
            >
              <input
                type="checkbox"
                className="accent-[var(--admin-accent)]"
                checked={value}
                onChange={(e) => setter(e.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>
      </AdminPanel>

      <AdminPanel
        title="Imagens"
        description="Upload otimizado para WebP. A primeira imagem é a capa."
      >
        <ImageUploader folder="products" urls={images} onChange={setImages} />
      </AdminPanel>

      <AdminPanel title="Descrição">
        <div className="space-y-4">
          <AdminField label="Resumo">
            <AdminTextarea
              rows={2}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
            />
          </AdminField>
          <AdminField label="Descrição completa">
            <AdminTextarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </AdminField>
        </div>
      </AdminPanel>

      <AdminPanel
        title="Tamanhos & cores"
        description="Metadados de exibição. O estoque vive nas variantes."
      >
        <AdminField
          label="Tamanhos"
          hint="Separe por vírgula — ex.: PP, P, M, G"
        >
          <AdminInput
            value={sizesText}
            onChange={(e) => setSizesText(e.target.value)}
            placeholder="PP, P, M, G"
          />
        </AdminField>

        <div className="mt-5 space-y-2.5">
          <p className="admin-label !mb-2">Cores</p>
          {colors.map((color, index) => (
            <div
              key={index}
              className="flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--admin-line)] bg-white/50 p-2.5"
            >
              <AdminInput
                value={color.name}
                onChange={(e) => {
                  const next = [...colors];
                  next[index] = { ...next[index], name: e.target.value };
                  setColors(next);
                }}
                placeholder="Nome da cor"
                className="min-w-[140px] flex-1"
              />
              <input
                type="color"
                value={color.hex}
                onChange={(e) => {
                  const next = [...colors];
                  next[index] = { ...next[index], hex: e.target.value };
                  setColors(next);
                }}
                className="h-11 w-12 cursor-pointer rounded-xl border border-[var(--admin-line)] bg-white p-1"
              />
              <AdminButton
                type="button"
                variant="ghost"
                onClick={() => setColors(colors.filter((_, i) => i !== index))}
              >
                <Trash2 className="size-4" />
              </AdminButton>
            </div>
          ))}
          <AdminButton
            type="button"
            variant="secondary"
            onClick={() => setColors([...colors, { name: "", hex: "#B76E79" }])}
          >
            <Plus className="size-4" />
            Adicionar cor
          </AdminButton>
        </div>
      </AdminPanel>

      <AdminPanel
        title="Matriz de variantes"
        description="Cada combinação tamanho × cor vira SKU com estoque próprio."
      >
        <VariantMatrix
          sizes={sizes}
          colors={colorNames}
          productSlug={slug || slugify(name)}
          variants={variants}
          onChange={setVariants}
        />
      </AdminPanel>

      {error ? <AdminAlert>{error}</AdminAlert> : null}

      <div className="sticky bottom-3 z-20 -mx-1 flex flex-col gap-2 rounded-2xl border border-[var(--admin-line)] bg-white/95 p-2.5 shadow-[var(--admin-shadow)] backdrop-blur sm:bottom-4 sm:mx-0 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:p-3"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <AdminButton type="submit" disabled={saving} className="w-full sm:w-auto">
          {saving ? <AdminSpinner /> : <Save className="size-4" />}
          {saving
            ? "Salvando…"
            : mode === "create"
              ? "Criar produto"
              : "Salvar alterações"}
        </AdminButton>
        <Link href="/admin/produtos" className="w-full sm:w-auto">
          <AdminButton type="button" variant="ghost" className="w-full sm:w-auto">
            <ArrowLeft className="size-4" />
            Voltar
          </AdminButton>
        </Link>
      </div>
    </form>
  );
}
