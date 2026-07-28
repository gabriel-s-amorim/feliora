"use client";

import { RefreshCw } from "lucide-react";
import { useMemo } from "react";
import { AdminButton, AdminInput } from "@/components/admin/ui";

export type VariantDraft = {
  sizeLabel: string;
  colorName: string;
  sku: string;
  stockCount: number;
  isActive: boolean;
};

type Props = {
  sizes: string[];
  colors: string[];
  productSlug: string;
  variants: VariantDraft[];
  onChange: (variants: VariantDraft[]) => void;
};

function skuFor(slug: string, size: string, color: string): string {
  const base = slug || "sku";
  const parts = [base, size, color]
    .filter(Boolean)
    .map((p) =>
      p
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    );
  return parts.join("-").slice(0, 64);
}

export function VariantMatrix({
  sizes,
  colors,
  productSlug,
  variants,
  onChange,
}: Props) {
  const colorNames = useMemo(
    () => (colors.length > 0 ? colors : [""]),
    [colors]
  );

  const combos = useMemo(() => {
    const list: { sizeLabel: string; colorName: string }[] = [];
    for (const size of sizes) {
      for (const color of colorNames) {
        list.push({ sizeLabel: size, colorName: color });
      }
    }
    return list;
  }, [sizes, colorNames]);

  function findVariant(sizeLabel: string, colorName: string) {
    return variants.find(
      (v) =>
        v.sizeLabel.toLowerCase() === sizeLabel.toLowerCase() &&
        v.colorName.toLowerCase() === colorName.toLowerCase()
    );
  }

  function upsert(
    sizeLabel: string,
    colorName: string,
    patch: Partial<VariantDraft>
  ) {
    const existing = findVariant(sizeLabel, colorName);
    if (existing) {
      onChange(variants.map((v) => (v === existing ? { ...v, ...patch } : v)));
      return;
    }

    onChange([
      ...variants,
      {
        sizeLabel,
        colorName,
        sku: skuFor(productSlug, sizeLabel, colorName),
        stockCount: 0,
        isActive: true,
        ...patch,
      },
    ]);
  }

  function generateMatrix() {
    if (sizes.length === 0) return;

    const next: VariantDraft[] = combos.map(({ sizeLabel, colorName }) => {
      const existing = findVariant(sizeLabel, colorName);
      return (
        existing ?? {
          sizeLabel,
          colorName,
          sku: skuFor(productSlug, sizeLabel, colorName),
          stockCount: 0,
          isActive: true,
        }
      );
    });
    onChange(next);
  }

  if (sizes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--admin-line)] bg-white/40 px-4 py-8 text-center text-sm text-[var(--admin-muted)]">
        Adicione ao menos um tamanho para gerar a matriz de variantes.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[var(--admin-muted)]">
          {combos.length} combinação(ões) tamanho × cor
        </p>
        <AdminButton type="button" variant="secondary" onClick={generateMatrix}>
          <RefreshCw className="size-4" />
          Gerar / sincronizar matriz
        </AdminButton>
      </div>

      <div className="admin-table-wrap overflow-x-auto">
        <table className="admin-table min-w-[640px]">
          <thead>
            <tr>
              <th>Tamanho</th>
              <th>Cor</th>
              <th>SKU</th>
              <th>Estoque</th>
              <th>Ativa</th>
            </tr>
          </thead>
          <tbody>
            {combos.map(({ sizeLabel, colorName }) => {
              const row = findVariant(sizeLabel, colorName);
              return (
                <tr key={`${sizeLabel}-${colorName}`}>
                  <td className="font-medium">{sizeLabel}</td>
                  <td>{colorName || "—"}</td>
                  <td>
                    <AdminInput
                      className="!w-44 !px-2.5 !py-1.5 text-xs"
                      value={
                        row?.sku ?? skuFor(productSlug, sizeLabel, colorName)
                      }
                      onChange={(e) =>
                        upsert(sizeLabel, colorName, { sku: e.target.value })
                      }
                      onFocus={() => {
                        if (!row) upsert(sizeLabel, colorName, {});
                      }}
                    />
                  </td>
                  <td>
                    <AdminInput
                      type="number"
                      min={0}
                      className="!w-24 !px-2.5 !py-1.5"
                      value={row?.stockCount ?? 0}
                      onChange={(e) =>
                        upsert(sizeLabel, colorName, {
                          stockCount: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      onFocus={() => {
                        if (!row) upsert(sizeLabel, colorName, {});
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      className="size-4 accent-[var(--admin-accent)]"
                      checked={row?.isActive ?? true}
                      onChange={(e) =>
                        upsert(sizeLabel, colorName, {
                          isActive: e.target.checked,
                        })
                      }
                      onFocus={() => {
                        if (!row) upsert(sizeLabel, colorName, {});
                      }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
