"use client";

import {
  CheckCircle2,
  FileSpreadsheet,
  Upload,
  X,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminAlert,
  AdminBadge,
  AdminButton,
  AdminSelect,
  AdminSpinner,
} from "@/components/admin/ui";
import {
  AdminApiError,
  adminListCategories,
  adminParseTikTokXlsx,
  adminRunTikTokImport,
  type TikTokParseSummary,
} from "@/lib/admin/client";
import { cn, formatPrice } from "@/lib/utils";
import type {
  SingleVariationAs,
  TikTokImportAction,
  TikTokParsedProduct,
} from "@/lib/admin/tiktokImport/types";
import type { Category } from "@/shared/types/category";
import type { MarketplaceSyncJob } from "@/shared/types/marketplace";

type Step = "upload" | "preview" | "running" | "summary";

type RowState = {
  included: boolean;
  action: TikTokImportAction;
  categoryId: string | null;
  singleVariationAs: SingleVariationAs;
};

async function pollJob(
  jobId: string,
  onUpdate: (job: MarketplaceSyncJob) => void
): Promise<MarketplaceSyncJob> {
  for (let i = 0; i < 300; i++) {
    const res = await fetch(
      `/api/admin/marketplace?action=job&id=${encodeURIComponent(jobId)}`
    );
    const job = (await res.json()) as MarketplaceSyncJob & { error?: string };
    if (!res.ok) throw new Error(job.error ?? "Falha ao consultar job");
    onUpdate(job);
    if (
      job.status === "completed" ||
      job.status === "failed" ||
      job.status === "partial"
    ) {
      return job;
    }
    await new Promise((r) => setTimeout(r, 800));
  }
  throw new Error("Tempo esgotado aguardando a importação");
}

function buildInitialRows(
  products: TikTokParsedProduct[]
): Record<string, RowState> {
  const rows: Record<string, RowState> = {};
  for (const p of products) {
    rows[p.tiktokProductId] = {
      included: p.defaultAction !== "skip",
      action: p.defaultAction,
      categoryId: p.categoryId,
      singleVariationAs: p.suggestedSingleVariationAs,
    };
  }
  return rows;
}

type Props = {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
};

export function TikTokImportModal({ open, onClose, onDone }: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [error, setError] = useState("");
  const [parsing, setParsing] = useState(false);
  const [products, setProducts] = useState<TikTokParsedProduct[]>([]);
  const [summary, setSummary] = useState<TikTokParseSummary | null>(null);
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [job, setJob] = useState<MarketplaceSyncJob | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!open) return;
    adminListCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, [open]);

  function reset() {
    setStep("upload");
    setError("");
    setParsing(false);
    setProducts([]);
    setSummary(null);
    setRows({});
    setJob(null);
    setDragOver(false);
  }

  function handleClose() {
    if (step === "running") return;
    reset();
    onClose();
  }

  async function handleFile(file: File | null) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setError("Aceitamos apenas arquivos .xlsx.");
      return;
    }
    setParsing(true);
    setError("");
    try {
      const data = await adminParseTikTokXlsx(file);
      setProducts(data.products);
      setSummary(data.summary);
      setRows(buildInitialRows(data.products));
      setStep("preview");
    } catch (err) {
      setError(
        err instanceof AdminApiError
          ? err.message
          : "Não foi possível ler a planilha"
      );
    } finally {
      setParsing(false);
    }
  }

  const selectedCount = useMemo(
    () =>
      products.filter((p) => {
        const row = rows[p.tiktokProductId];
        return row?.included && row.action !== "skip";
      }).length,
    [products, rows]
  );

  const imagesToConvert = useMemo(() => {
    return products.reduce((sum, p) => {
      const row = rows[p.tiktokProductId];
      if (!row?.included || row.action === "skip") return sum;
      // update: estimativa conservadora — conta todas; worker pula iguais
      return sum + p.imageUrls.length;
    }, 0);
  }, [products, rows]);

  const startImport = useCallback(
    async (onlyIds?: string[]) => {
      setError("");
      const selections = products
        .filter((p) => {
          if (onlyIds && !onlyIds.includes(p.tiktokProductId)) return false;
          const row = rows[p.tiktokProductId];
          return row?.included && row.action !== "skip";
        })
        .map((p) => {
          const row = rows[p.tiktokProductId];
          return {
            tiktokProductId: p.tiktokProductId,
            action: (row.action === "update" ? "update" : "create") as
              | "create"
              | "update",
            categoryId: row.categoryId,
            singleVariationAs: row.singleVariationAs,
          };
        });

      if (selections.length === 0) {
        setError("Selecione ao menos um produto para importar.");
        return;
      }

      setStep("running");
      setJob(null);
      try {
        const { jobId } = await adminRunTikTokImport({
          products,
          selections,
        });
        const finalJob = await pollJob(jobId, setJob);
        setJob(finalJob);
        setStep("summary");
        onDone();
      } catch (err) {
        setError(
          err instanceof AdminApiError || err instanceof Error
            ? err.message
            : "Falha na importação"
        );
        setStep("preview");
      }
    },
    [products, rows, onDone]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Importar do TikTok"
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl bg-[var(--admin-surface)] shadow-xl sm:rounded-2xl"
      >
        <header className="flex items-center justify-between gap-3 border-b border-[var(--admin-line)] px-4 py-3 sm:px-5">
          <div>
            <h3 className="text-lg font-semibold text-[var(--admin-ink)]">
              Importar do TikTok
            </h3>
            <p className="text-sm text-[var(--admin-muted)]">
              Planilha Bulk Edit · All Information
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={step === "running"}
            className="rounded-lg p-2 text-[var(--admin-muted)] hover:bg-[var(--admin-bg)] disabled:opacity-40"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {error ? (
            <div className="mb-4">
              <AdminAlert>{error}</AdminAlert>
            </div>
          ) : null}

          {step === "upload" ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                void handleFile(e.dataTransfer.files?.[0] ?? null);
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-16 text-center transition-colors",
                dragOver
                  ? "border-[var(--admin-accent)] bg-[var(--admin-bg)]"
                  : "border-[var(--admin-line)]"
              )}
            >
              {parsing ? (
                <>
                  <AdminSpinner />
                  <p className="text-sm text-[var(--admin-muted)]">
                    Validando planilha…
                  </p>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="size-10 text-[var(--admin-muted)]" />
                  <p className="text-sm font-medium text-[var(--admin-ink)]">
                    Arraste o .xlsx exportado do Seller Center
                  </p>
                  <p className="max-w-sm text-xs text-[var(--admin-muted)]">
                    Template “All Information”. Cabeçalho nas linhas 1–5; dados a
                    partir da linha 6.
                  </p>
                  <label className="mt-2">
                    <input
                      type="file"
                      accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      className="hidden"
                      onChange={(e) =>
                        void handleFile(e.target.files?.[0] ?? null)
                      }
                    />
                    <span className="admin-btn admin-btn-primary inline-flex cursor-pointer items-center gap-2 px-4 py-2">
                      <Upload className="size-4" />
                      Escolher arquivo
                    </span>
                  </label>
                </>
              )}
            </div>
          ) : null}

          {step === "preview" && summary ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-[var(--admin-line)] bg-[var(--admin-bg)] px-4 py-3 text-sm text-[var(--admin-muted)]">
                <p>
                  <strong className="text-[var(--admin-ink)]">
                    {summary.productCount}
                  </strong>{" "}
                  produto(s) · {summary.variantCount} SKU(s) ·{" "}
                  {imagesToConvert} imagem(ns) a converter · ~{" "}
                  {Math.max(5, Math.round(imagesToConvert * 1.5))}s estimados
                </p>
                {summary.duplicates > 0 ? (
                  <p className="mt-1">
                    {summary.duplicates} já existem na loja (padrão: pular).
                  </p>
                ) : null}
              </div>

              <ul className="divide-y divide-[var(--admin-line)] rounded-xl border border-[var(--admin-line)]">
                {products.map((p) => {
                  const row = rows[p.tiktokProductId];
                  if (!row) return null;
                  return (
                    <li
                      key={p.tiktokProductId}
                      className={cn(
                        "flex flex-col gap-3 p-3 sm:flex-row sm:items-start",
                        !row.included && "opacity-50"
                      )}
                    >
                      <div className="flex gap-3 sm:min-w-0 sm:flex-1">
                        <input
                          type="checkbox"
                          checked={row.included}
                          onChange={(e) =>
                            setRows((prev) => {
                              const checked = e.target.checked;
                              const current = prev[p.tiktokProductId];
                              return {
                                ...prev,
                                [p.tiktokProductId]: {
                                  ...current,
                                  included: checked,
                                  action:
                                    checked &&
                                    p.duplicate.matchedBy &&
                                    current.action === "skip"
                                      ? "update"
                                      : !checked && p.duplicate.matchedBy
                                        ? "skip"
                                        : current.action,
                                },
                              };
                            })
                          }
                          className="mt-2"
                          aria-label={`Incluir ${p.name}`}
                        />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {p.mainImageUrl ? (
                          <img
                            src={p.mainImageUrl}
                            alt=""
                            className="size-14 shrink-0 rounded-lg object-cover bg-[var(--admin-bg)]"
                          />
                        ) : (
                          <div className="size-14 shrink-0 rounded-lg bg-[var(--admin-bg)]" />
                        )}
                        <div className="min-w-0 space-y-1">
                          <p className="truncate font-medium text-[var(--admin-ink)]">
                            {p.name}
                          </p>
                          <p className="text-sm text-[var(--admin-muted)]">
                            {formatPrice(p.price)} · {p.variants.length}{" "}
                            variante(s) · estoque {p.totalStock}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {p.duplicate.matchedBy ? (
                              <AdminBadge>
                                Já existe ({p.duplicate.matchedBy})
                              </AdminBadge>
                            ) : null}
                            {p.priceVaries ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800">
                                <AlertTriangle className="size-3" />
                                preços variam — usando {formatPrice(p.price)}{" "}
                                (menor)
                              </span>
                            ) : null}
                            {!p.categoryMapped ? (
                              <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                                sem categoria
                                {p.categoryName
                                  ? ` — TikTok: ${p.categoryName}`
                                  : ""}
                              </span>
                            ) : (
                              <AdminBadge tone="success">
                                categoria mapeada
                              </AdminBadge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:w-52">
                        {p.duplicate.matchedBy ? (
                          <AdminSelect
                            value={row.action}
                            disabled={!row.included}
                            onChange={(e) =>
                              setRows((prev) => ({
                                ...prev,
                                [p.tiktokProductId]: {
                                  ...prev[p.tiktokProductId],
                                  action: e.target.value as TikTokImportAction,
                                },
                              }))
                            }
                          >
                            <option value="skip">Pular</option>
                            <option value="update">Atualizar</option>
                          </AdminSelect>
                        ) : null}

                        <AdminSelect
                          value={row.categoryId ?? ""}
                          disabled={!row.included}
                          onChange={(e) =>
                            setRows((prev) => ({
                              ...prev,
                              [p.tiktokProductId]: {
                                ...prev[p.tiktokProductId],
                                categoryId: e.target.value || null,
                              },
                            }))
                          }
                        >
                          <option value="">Sem categoria</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </AdminSelect>

                        {p.singleDimVariation ? (
                          <div className="flex overflow-hidden rounded-lg border border-[var(--admin-line)] text-xs">
                            {(["size", "color"] as const).map((mode) => (
                              <button
                                key={mode}
                                type="button"
                                disabled={!row.included}
                                onClick={() =>
                                  setRows((prev) => ({
                                    ...prev,
                                    [p.tiktokProductId]: {
                                      ...prev[p.tiktokProductId],
                                      singleVariationAs: mode,
                                    },
                                  }))
                                }
                                className={cn(
                                  "flex-1 px-2 py-1.5",
                                  row.singleVariationAs === mode
                                    ? "bg-[var(--admin-ink)] text-white"
                                    : "bg-transparent text-[var(--admin-muted)]"
                                )}
                              >
                                {mode === "size" ? "Tamanho" : "Cor"}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {step === "running" ? (
            <div className="flex flex-col items-center gap-4 py-12">
              <AdminSpinner />
              <p className="text-sm font-medium text-[var(--admin-ink)]">
                Importando produtos…
              </p>
              {job ? (
                <>
                  <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-[var(--admin-bg)]">
                    <div
                      className="h-full rounded-full bg-[var(--admin-accent)] transition-all"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-[var(--admin-muted)]">
                    {job.doneItems}/{job.totalItems} · {job.progress}%
                  </p>
                </>
              ) : (
                <p className="text-sm text-[var(--admin-muted)]">
                  Preparando lote…
                </p>
              )}
            </div>
          ) : null}

          {step === "summary" && job ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-[var(--admin-line)] px-4 py-4">
                <CheckCircle2 className="mt-0.5 size-5 text-emerald-600" />
                <div>
                  <p className="font-medium text-[var(--admin-ink)]">
                    Importação finalizada ({job.status})
                  </p>
                  <p className="mt-1 text-sm text-[var(--admin-muted)]">
                    {job.doneItems - job.errors.length} ok · {job.errors.length}{" "}
                    com erro
                  </p>
                </div>
              </div>

              {job.errors.length > 0 ? (
                <ul className="space-y-2">
                  {job.errors.map((err, idx) => (
                    <li
                      key={`${err.externalId}-${idx}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--admin-line)] px-3 py-2 text-sm"
                    >
                      <span className="text-[var(--admin-ink)]">
                        {err.externalId ?? "—"}: {err.message}
                      </span>
                      {err.externalId ? (
                        <AdminButton
                          variant="secondary"
                          className="!px-2 !py-1 text-xs"
                          onClick={() => void startImport([err.externalId!])}
                        >
                          <RefreshCw className="size-3.5" />
                          Retry
                        </AdminButton>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--admin-line)] px-4 py-3 sm:px-5">
          {step === "preview" ? (
            <>
              <AdminButton variant="ghost" onClick={reset}>
                Outro arquivo
              </AdminButton>
              <AdminButton
                disabled={selectedCount === 0}
                onClick={() => void startImport()}
              >
                Importar {selectedCount > 0 ? `(${selectedCount})` : ""}
              </AdminButton>
            </>
          ) : null}
          {step === "summary" ? (
            <AdminButton
              onClick={() => {
                reset();
                onClose();
              }}
            >
              Fechar
            </AdminButton>
          ) : null}
          {step === "upload" ? (
            <AdminButton variant="ghost" onClick={handleClose}>
              Cancelar
            </AdminButton>
          ) : null}
        </footer>
      </div>
    </div>
  );
}
