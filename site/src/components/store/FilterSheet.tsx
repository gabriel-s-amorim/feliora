"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { CategoryNavItem } from "@/shared/types/category";
import { cn } from "@/lib/utils";

export type CatalogFacets = {
  sizes: string[];
  colors: { name: string; hex: string }[];
  minPrice: number;
  maxPrice: number;
};

type FilterSheetProps = {
  categories: CategoryNavItem[];
  facets: CatalogFacets;
  basePath?: string;
};

export function FilterSheet({
  categories,
  facets,
  basePath = "/catalogo",
}: FilterSheetProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const current = useMemo(
    () => ({
      category: searchParams.get("categoria") ?? "",
      size: searchParams.get("tamanho") ?? "",
      color: searchParams.get("cor") ?? "",
      sort: searchParams.get("ordem") ?? "newest",
      min: searchParams.get("min") ?? "",
      max: searchParams.get("max") ?? "",
    }),
    [searchParams]
  );

  const [draft, setDraft] = useState(current);

  function openSheet() {
    setDraft(current);
    setOpen(true);
  }

  function apply(next: typeof draft) {
    const params = new URLSearchParams();
    const q = searchParams.get("q");
    if (q) params.set("q", q);
    if (next.category && basePath === "/catalogo") {
      params.set("categoria", next.category);
    }
    if (next.size) params.set("tamanho", next.size);
    if (next.color) params.set("cor", next.color);
    if (next.sort && next.sort !== "newest") params.set("ordem", next.sort);
    if (next.min) params.set("min", next.min);
    if (next.max) params.set("max", next.max);

    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${basePath}?${qs}` : basePath);
      setOpen(false);
    });
  }

  function clear() {
    apply({
      category: "",
      size: "",
      color: "",
      sort: "newest",
      min: "",
      max: "",
    });
  }

  const activeCount = [
    current.category,
    current.size,
    current.color,
    current.min,
    current.max,
  ].filter(Boolean).length;

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={openSheet}
          className="inline-flex min-h-11 items-center border border-line px-4 text-xs tracking-[0.14em] text-ink transition-colors hover:border-rose-gold"
        >
          Filtros{activeCount ? ` (${activeCount})` : ""}
        </button>

        <label className="flex items-center gap-2 text-xs text-ink-muted">
          <span className="hidden sm:inline">Ordenar</span>
          <select
            className="min-h-11 border border-line bg-cream px-3 text-xs tracking-wide text-ink outline-none focus:border-rose-gold"
            value={current.sort}
            onChange={(e) =>
              apply({ ...current, sort: e.target.value })
            }
          >
            <option value="newest">Novidades</option>
            <option value="price_asc">Menor preço</option>
            <option value="price_desc">Maior preço</option>
            <option value="featured">Destaques</option>
            <option value="name">Nome</option>
          </select>
        </label>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            aria-label="Fechar filtros"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 max-h-[85dvh] w-full overflow-y-auto rounded-t-md border border-line bg-cream p-5 pb-8 sm:max-w-md">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-xl tracking-[0.08em] text-ink">
                Filtros
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="size-10 text-ink-muted"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            {basePath === "/catalogo" && categories.length > 0 ? (
              <fieldset className="mb-6">
                <legend className="text-xs uppercase tracking-[0.16em] text-earth">
                  Categoria
                </legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Chip
                    active={!draft.category}
                    onClick={() => setDraft((d) => ({ ...d, category: "" }))}
                  >
                    Todas
                  </Chip>
                  {categories.map((c) => (
                    <Chip
                      key={c.id}
                      active={draft.category === c.slug}
                      onClick={() =>
                        setDraft((d) => ({ ...d, category: c.slug }))
                      }
                    >
                      {c.name}
                    </Chip>
                  ))}
                </div>
              </fieldset>
            ) : null}

            {facets.sizes.length > 0 ? (
              <fieldset className="mb-6">
                <legend className="text-xs uppercase tracking-[0.16em] text-earth">
                  Tamanho
                </legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {facets.sizes.map((s) => (
                    <Chip
                      key={s}
                      active={draft.size === s}
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          size: d.size === s ? "" : s,
                        }))
                      }
                    >
                      {s}
                    </Chip>
                  ))}
                </div>
              </fieldset>
            ) : null}

            {facets.colors.length > 0 ? (
              <fieldset className="mb-6">
                <legend className="text-xs uppercase tracking-[0.16em] text-earth">
                  Cor
                </legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {facets.colors.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      title={c.name}
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          color: d.color === c.name ? "" : c.name,
                        }))
                      }
                      className={cn(
                        "size-8 rounded-full border-2",
                        draft.color === c.name
                          ? "border-rose-gold"
                          : "border-transparent"
                      )}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </fieldset>
            ) : null}

            <fieldset className="mb-8">
              <legend className="text-xs uppercase tracking-[0.16em] text-earth">
                Preço (R$)
              </legend>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <input
                  inputMode="decimal"
                  placeholder="Mín"
                  value={draft.min}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, min: e.target.value }))
                  }
                  className="min-h-11 border border-line bg-cream px-3 text-sm outline-none focus:border-rose-gold"
                />
                <input
                  inputMode="decimal"
                  placeholder="Máx"
                  value={draft.max}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, max: e.target.value }))
                  }
                  className="min-h-11 border border-line bg-cream px-3 text-sm outline-none focus:border-rose-gold"
                />
              </div>
            </fieldset>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={clear}
                className="min-h-12 flex-1 border border-line text-sm tracking-[0.12em] text-ink-muted"
                disabled={pending}
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => apply(draft)}
                className="min-h-12 flex-1 border border-rose-gold bg-rose-gold text-sm tracking-[0.12em] text-cream"
                disabled={pending}
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-10 border px-3 text-xs tracking-wide transition-colors",
        active
          ? "border-rose-gold bg-rose-gold text-cream"
          : "border-line text-ink"
      )}
    >
      {children}
    </button>
  );
}
