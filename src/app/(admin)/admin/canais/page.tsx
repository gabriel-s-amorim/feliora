"use client";

import {
  Check,
  Download,
  RefreshCw,
  Send,
  Store,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell, RequireAdmin } from "@/components/admin/AdminShell";
import {
  AdminAlert,
  AdminButton,
  AdminEmpty,
  AdminInput,
  AdminSpinner,
} from "@/components/admin/ui";
import { adminListProducts, adminListCategories, AdminApiError } from "@/lib/admin/client";
import { cn, formatPrice } from "@/lib/utils";
import type {
  MarketplaceChannel,
  MarketplaceChannelStatus,
  MarketplaceExportReadiness,
  MarketplaceProductLink,
  MarketplaceRemoteProduct,
  MarketplaceSyncJob,
} from "@/shared/types/marketplace";
import type { Product } from "@/shared/types/product";
import type { Category } from "@/shared/types/category";

type Tab = "enviar" | "importar" | "categorias" | "sync";

async function pollJob(
  jobId: string,
  onUpdate: (job: MarketplaceSyncJob) => void
): Promise<MarketplaceSyncJob> {
  for (let i = 0; i < 120; i++) {
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
  throw new Error("Tempo esgotado aguardando sync");
}

export default function AdminCanaisPage() {
  const [tab, setTab] = useState<Tab>("enviar");
  const [channels, setChannels] = useState<{
    shopee: MarketplaceChannelStatus | null;
    tiktok: MarketplaceChannelStatus | null;
  }>({ shopee: null, tiktok: null });
  const [products, setProducts] = useState<Product[]>([]);
  const [links, setLinks] = useState<MarketplaceProductLink[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [job, setJob] = useState<MarketplaceSyncJob | null>(null);

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [exportChannels, setExportChannels] = useState<Set<MarketplaceChannel>>(
    new Set(["shopee", "tiktok"])
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [readiness, setReadiness] = useState<MarketplaceExportReadiness[]>([]);
  const [query, setQuery] = useState("");

  const [importChannel, setImportChannel] =
    useState<MarketplaceChannel>("shopee");
  const [remote, setRemote] = useState<MarketplaceRemoteProduct[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteSelected, setRemoteSelected] = useState<Set<string>>(new Set());
  const [importCategoryId, setImportCategoryId] = useState<string>("");

  const [mapChannel, setMapChannel] = useState<MarketplaceChannel>("shopee");
  const [remoteCats, setRemoteCats] = useState<
    Array<{ id: string; name: string; parentId: string | null; hasChildren: boolean }>
  >([]);
  const [maps, setMaps] = useState<
    Array<{
      id: string;
      channel: MarketplaceChannel;
      felioraCategoryId: string;
      externalCategoryId: string;
      externalCategoryName: string;
    }>
  >([]);
  const [mapExternalId, setMapExternalId] = useState("");
  const [mapFelioraId, setMapFelioraId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [statusRes, productsList, linksRes, catsList, mapsRes] =
        await Promise.all([
          fetch("/api/admin/marketplace?action=status").then((r) => r.json()),
          adminListProducts(),
          fetch("/api/admin/marketplace?action=links").then((r) => r.json()),
          adminListCategories(),
          fetch("/api/admin/marketplace?action=category-maps").then((r) =>
            r.json()
          ),
        ]);
      if (statusRes.error) throw new Error(statusRes.error);
      setChannels({
        shopee: statusRes.shopee,
        tiktok: statusRes.tiktok,
      });
      setProducts(productsList);
      setLinks(linksRes.links ?? []);
      setCategories(catsList);
      setMaps(mapsRes.maps ?? []);
    } catch (err) {
      setError(
        err instanceof AdminApiError || err instanceof Error
          ? err.message
          : "Erro ao carregar"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
    );
  }, [products, query]);

  function toggleProduct(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function linkBadge(productId: number, channel: MarketplaceChannel) {
    const link = links.find(
      (l) => l.productId === productId && l.channel === channel
    );
    if (!link) return null;
    return (
      <span
        className={cn(
          "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase",
          link.status === "listed"
            ? "bg-emerald-50 text-emerald-700"
            : link.status === "error"
              ? "bg-red-50 text-red-700"
              : "bg-zinc-100 text-zinc-600"
        )}
      >
        {channel === "shopee" ? "SP" : "TT"}
      </span>
    );
  }

  async function openExportSheet() {
    if (selected.size === 0) return;
    setSheetOpen(true);
    setReadiness([]);
    const ids = [...selected];
    const results: MarketplaceExportReadiness[] = [];
    for (const channel of exportChannels) {
      const res = await fetch(
        `/api/admin/marketplace?action=readiness&channel=${channel}&productIds=${ids.join(",")}`
      );
      const data = await res.json();
      if (data.readiness) results.push(...data.readiness);
    }
    // Merge missing by product
    const byId = new Map<number, MarketplaceExportReadiness>();
    for (const r of results) {
      const cur = byId.get(r.productId);
      if (!cur) byId.set(r.productId, { ...r });
      else {
        byId.set(r.productId, {
          productId: r.productId,
          ready: cur.ready && r.ready,
          missing: [...new Set([...cur.missing, ...r.missing])],
        });
      }
    }
    setReadiness([...byId.values()]);
  }

  async function runExport() {
    setMessage("");
    try {
      const res = await fetch("/api/admin/marketplace?action=export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channels: [...exportChannels],
          productIds: [...selected],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha no export");
      setSheetOpen(false);
      const finalJob = await pollJob(data.jobId, setJob);
      setMessage(
        finalJob.status === "completed"
          ? "Produtos enviados."
          : `Concluído com avisos (${finalJob.errors.length}).`
      );
      await load();
      setSelected(new Set());
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro no export");
    }
  }

  async function runSync(type: "price" | "stock" | "full") {
    setMessage("");
    try {
      const res = await fetch("/api/admin/marketplace?action=sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          productIds: selected.size ? [...selected] : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha no sync");
      const finalJob = await pollJob(data.jobId, setJob);
      setMessage(
        finalJob.status === "completed"
          ? `Sync ${type} ok (${finalJob.totalItems} itens).`
          : `Sync parcial — ${finalJob.errors.length} erro(s).`
      );
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro no sync");
    }
  }

  async function loadRemote() {
    setRemoteLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/marketplace?action=remote-products&channel=${importChannel}&page=0`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha ao listar remoto");
      setRemote(data.products ?? []);
      setRemoteSelected(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setRemoteLoading(false);
    }
  }

  async function runImport() {
    if (remoteSelected.size === 0) return;
    setMessage("");
    try {
      const res = await fetch("/api/admin/marketplace?action=import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: importChannel,
          externalItemIds: [...remoteSelected],
          categoryId: importCategoryId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha no import");
      const finalJob = await pollJob(data.jobId, setJob);
      setMessage(
        finalJob.status === "completed"
          ? "Importação concluída."
          : `Importação parcial — ${finalJob.errors.length} erro(s).`
      );
      await load();
      await loadRemote();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro no import");
    }
  }

  async function loadRemoteCategories() {
    try {
      const res = await fetch(
        `/api/admin/marketplace?action=categories&channel=${mapChannel}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro categorias");
      setRemoteCats(
        (data.categories ?? []).filter(
          (c: { hasChildren: boolean }) => !c.hasChildren
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    }
  }

  async function saveCategoryMap() {
    if (!mapFelioraId || !mapExternalId) return;
    const cat = remoteCats.find((c) => c.id === mapExternalId);
    const res = await fetch("/api/admin/marketplace?action=category-map", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: mapChannel,
        felioraCategoryId: mapFelioraId,
        externalCategoryId: mapExternalId,
        externalCategoryName: cat?.name ?? "",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Erro ao mapear");
      return;
    }
    setMessage("Categoria mapeada.");
    const mapsRes = await fetch(
      "/api/admin/marketplace?action=category-maps"
    ).then((r) => r.json());
    setMaps(mapsRes.maps ?? []);
  }

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "enviar", label: "Enviar" },
    { id: "importar", label: "Importar" },
    { id: "sync", label: "Sync" },
    { id: "categorias", label: "Categorias" },
  ];

  return (
    <RequireAdmin>
      <AdminShell
        title="Canais"
        description="Shopee e TikTok Shop — importar, enviar e sincronizar preço/estoque."
      >
        <div className="mb-4 flex flex-wrap gap-2 text-xs">
          {(["shopee", "tiktok"] as const).map((ch) => {
            const st = channels[ch];
            return (
              <span
                key={ch}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium",
                  st?.connected
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-amber-50 text-amber-800"
                )}
              >
                <Store className="size-3.5" />
                {ch === "shopee" ? "Shopee" : "TikTok"}
                {st?.connected ? " · ok" : " · off"}
              </span>
            );
          })}
          <a
            href="/admin/integracoes"
            className="inline-flex items-center rounded-full border border-zinc-200 px-3 py-1.5 text-zinc-600"
          >
            Credenciais
          </a>
        </div>

        <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-zinc-100 p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "min-h-10 flex-1 rounded-lg px-3 text-sm font-medium whitespace-nowrap",
                tab === t.id
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-600"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error ? <div className="mb-4"><AdminAlert>{error}</AdminAlert></div> : null}
        {message ? (
          <p className="mb-4 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
            {message}
          </p>
        ) : null}

        {job &&
        (job.status === "running" || job.status === "pending") ? (
          <div className="mb-4 rounded-xl border border-zinc-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">
                {job.jobType} · {job.doneItems}/{job.totalItems}
              </span>
              <span>{job.progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full bg-zinc-900 transition-all"
                style={{ width: `${job.progress}%` }}
              />
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <AdminSpinner /> Carregando…
          </div>
        ) : null}

        {!loading && tab === "enviar" ? (
          <div className="pb-28">
            <div className="mb-3">
              <AdminInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar produtos…"
              />
            </div>
            {filtered.length === 0 ? (
              <AdminEmpty title="Nenhum produto" />
            ) : (
              <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
                {filtered.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => toggleProduct(p.id)}
                      className="flex w-full items-center gap-3 px-3 py-3 text-left active:bg-zinc-50"
                    >
                      <span
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded border",
                          selected.has(p.id)
                            ? "border-zinc-900 bg-zinc-900 text-white"
                            : "border-zinc-300"
                        )}
                      >
                        {selected.has(p.id) ? (
                          <Check className="size-3.5" />
                        ) : null}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-900">
                          {p.name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {formatPrice(p.price)} · estoque {p.stockCount}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {linkBadge(p.id, "shopee")}
                        {linkBadge(p.id, "tiktok")}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="fixed inset-x-0 bottom-16 z-40 border-t border-zinc-200 bg-white/95 p-3 backdrop-blur sm:bottom-0 md:static md:mt-4 md:rounded-xl md:border md:bg-white md:p-4">
              <div className="mx-auto flex max-w-3xl items-center gap-2">
                <p className="flex-1 text-sm text-zinc-600">
                  {selected.size} selecionado(s)
                </p>
                <AdminButton
                  disabled={selected.size === 0}
                  onClick={() => void openExportSheet()}
                  className="min-h-11"
                >
                  <Send className="size-4" />
                  Enviar
                </AdminButton>
              </div>
            </div>
          </div>
        ) : null}

        {!loading && tab === "importar" ? (
          <div className="space-y-4 pb-24">
            <div className="flex flex-wrap gap-2">
              {(["shopee", "tiktok"] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setImportChannel(ch)}
                  className={cn(
                    "min-h-10 rounded-lg px-4 text-sm font-medium",
                    importChannel === ch
                      ? "bg-zinc-900 text-white"
                      : "border border-zinc-200 bg-white"
                  )}
                >
                  {ch === "shopee" ? "Shopee" : "TikTok"}
                </button>
              ))}
              <AdminButton
                variant="secondary"
                onClick={() => void loadRemote()}
                className="min-h-10"
              >
                <Download className="size-4" />
                Carregar catálogo
              </AdminButton>
            </div>
            <label className="block text-sm">
              Categoria Feliora (opcional)
              <select
                value={importCategoryId}
                onChange={(e) => setImportCategoryId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
              >
                <option value="">—</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            {remoteLoading ? (
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <AdminSpinner /> Buscando…
              </div>
            ) : remote.length === 0 ? (
              <AdminEmpty
                title="Nenhum item remoto"
                description="Conecte o canal e toque em Carregar catálogo."
              />
            ) : (
              <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
                {remote.map((item) => (
                  <li key={item.externalItemId}>
                    <button
                      type="button"
                      disabled={item.alreadyLinked}
                      onClick={() => {
                        setRemoteSelected((prev) => {
                          const next = new Set(prev);
                          if (next.has(item.externalItemId))
                            next.delete(item.externalItemId);
                          else next.add(item.externalItemId);
                          return next;
                        });
                      }}
                      className="flex w-full items-center gap-3 px-3 py-3 text-left disabled:opacity-50"
                    >
                      <span
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded border",
                          remoteSelected.has(item.externalItemId)
                            ? "border-zinc-900 bg-zinc-900 text-white"
                            : "border-zinc-300"
                        )}
                      >
                        {remoteSelected.has(item.externalItemId) ? (
                          <Check className="size-3.5" />
                        ) : null}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {item.name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {item.price != null
                            ? formatPrice(item.price)
                            : "—"}
                          {item.alreadyLinked ? " · já na Feliora" : ""}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="fixed inset-x-0 bottom-16 z-40 border-t border-zinc-200 bg-white/95 p-3 backdrop-blur sm:bottom-0 md:static md:rounded-xl md:border">
              <AdminButton
                className="min-h-11 w-full"
                disabled={remoteSelected.size === 0}
                onClick={() => void runImport()}
              >
                Trazer {remoteSelected.size || ""} para Feliora
              </AdminButton>
            </div>
          </div>
        ) : null}

        {!loading && tab === "sync" ? (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">
              Sincroniza produtos já vinculados. Se houver seleção na aba Enviar,
              usa só esses; senão, todos os listados.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <AdminButton
                className="min-h-14"
                onClick={() => void runSync("price")}
              >
                <RefreshCw className="size-4" />
                Preço
              </AdminButton>
              <AdminButton
                className="min-h-14"
                onClick={() => void runSync("stock")}
              >
                <RefreshCw className="size-4" />
                Estoque
              </AdminButton>
              <AdminButton
                className="min-h-14"
                variant="secondary"
                onClick={() => void runSync("full")}
              >
                <RefreshCw className="size-4" />
                Preço + Estoque
              </AdminButton>
            </div>
            {job?.errors?.length ? (
              <ul className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                {job.errors.slice(0, 8).map((e, i) => (
                  <li key={i}>
                    {e.productId ? `#${e.productId}: ` : ""}
                    {e.message}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {!loading && tab === "categorias" ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(["shopee", "tiktok"] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setMapChannel(ch)}
                  className={cn(
                    "min-h-10 rounded-lg px-4 text-sm font-medium",
                    mapChannel === ch
                      ? "bg-zinc-900 text-white"
                      : "border border-zinc-200"
                  )}
                >
                  {ch === "shopee" ? "Shopee" : "TikTok"}
                </button>
              ))}
              <AdminButton
                variant="secondary"
                onClick={() => void loadRemoteCategories()}
              >
                Carregar categorias leaf
              </AdminButton>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                Categoria Feliora
                <select
                  value={mapFelioraId}
                  onChange={(e) => setMapFelioraId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
                >
                  <option value="">—</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                Categoria {mapChannel}
                <select
                  value={mapExternalId}
                  onChange={(e) => setMapExternalId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
                >
                  <option value="">—</option>
                  {remoteCats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.id})
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <AdminButton onClick={() => void saveCategoryMap()}>
              Salvar mapeamento
            </AdminButton>
            <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white text-sm">
              {maps
                .filter((m) => m.channel === mapChannel)
                .map((m) => {
                  const cat = categories.find(
                    (c) => c.id === m.felioraCategoryId
                  );
                  return (
                    <li key={m.id} className="px-3 py-2">
                      {cat?.name ?? m.felioraCategoryId} →{" "}
                      {m.externalCategoryName || m.externalCategoryId}
                    </li>
                  );
                })}
            </ul>
          </div>
        ) : null}

        {sheetOpen ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-4 shadow-xl sm:rounded-2xl sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Enviar para canais</h3>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="rounded-lg p-2 hover:bg-zinc-100"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="mb-4 flex gap-2">
                {(["shopee", "tiktok"] as const).map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => {
                      setExportChannels((prev) => {
                        const next = new Set(prev);
                        if (next.has(ch)) next.delete(ch);
                        else next.add(ch);
                        return next;
                      });
                    }}
                    className={cn(
                      "min-h-11 flex-1 rounded-lg text-sm font-medium",
                      exportChannels.has(ch)
                        ? "bg-zinc-900 text-white"
                        : "border border-zinc-200"
                    )}
                  >
                    {ch === "shopee" ? "Shopee" : "TikTok"}
                  </button>
                ))}
              </div>
              <ul className="mb-4 space-y-2 text-sm">
                {readiness.map((r) => (
                  <li
                    key={r.productId}
                    className={cn(
                      "rounded-lg border px-3 py-2",
                      r.ready
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-amber-200 bg-amber-50"
                    )}
                  >
                    <p className="font-medium">
                      #{r.productId}{" "}
                      {r.ready ? "pronto" : "faltando campos"}
                    </p>
                    {!r.ready ? (
                      <p className="text-xs text-amber-800">
                        {r.missing.join(", ")}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
              <AdminButton
                className="min-h-12 w-full"
                disabled={exportChannels.size === 0}
                onClick={() => void runExport()}
              >
                Publicar agora
              </AdminButton>
            </div>
          </div>
        ) : null}
      </AdminShell>
    </RequireAdmin>
  );
}
