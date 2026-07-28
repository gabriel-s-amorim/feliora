"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminButton, AdminPanel, AdminSpinner } from "@/components/admin/ui";
import type {
  MarketplaceChannel,
  MarketplaceProductLink,
  MarketplaceSyncJob,
} from "@/shared/types/marketplace";

async function pollJob(jobId: string): Promise<MarketplaceSyncJob> {
  for (let i = 0; i < 60; i++) {
    const res = await fetch(
      `/api/admin/marketplace?action=job&id=${encodeURIComponent(jobId)}`
    );
    const job = (await res.json()) as MarketplaceSyncJob;
    if (
      job.status === "completed" ||
      job.status === "failed" ||
      job.status === "partial"
    ) {
      return job;
    }
    await new Promise((r) => setTimeout(r, 700));
  }
  throw new Error("Tempo esgotado");
}

export function ProductChannelsPanel({ productId }: { productId: number }) {
  const [links, setLinks] = useState<MarketplaceProductLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/marketplace?action=links&productIds=${productId}`
      );
      const data = await res.json();
      setLinks(data.links ?? []);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function syncChannel(channel: MarketplaceChannel, type: "full" | "stock") {
    setBusy(`${channel}-${type}`);
    setMessage("");
    try {
      const res = await fetch("/api/admin/marketplace?action=sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          channels: [channel],
          productIds: [productId],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      const job = await pollJob(data.jobId);
      setMessage(
        job.status === "completed"
          ? `${channel}: atualizado`
          : job.errors[0]?.message ?? "Concluído com avisos"
      );
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro");
    } finally {
      setBusy(null);
    }
  }

  async function exportTo(channel: MarketplaceChannel) {
    setBusy(`export-${channel}`);
    setMessage("");
    try {
      const res = await fetch("/api/admin/marketplace?action=export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channels: [channel],
          productIds: [productId],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      const job = await pollJob(data.jobId);
      setMessage(
        job.status === "completed"
          ? `Publicado em ${channel}`
          : job.errors[0]?.message ?? "Falhou"
      );
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro");
    } finally {
      setBusy(null);
    }
  }

  const channels: MarketplaceChannel[] = ["shopee", "tiktok"];

  return (
    <AdminPanel
      title="Canais"
      description="Status neste produto · sync rápido preço/estoque."
      actions={
        <Link
          href="/admin/canais"
          className="text-sm text-[var(--admin-muted)] underline"
        >
          Abrir Canais
        </Link>
      }
    >
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[var(--admin-muted)]">
          <AdminSpinner /> Carregando…
        </div>
      ) : (
        <div className="space-y-3">
          {channels.map((channel) => {
            const link = links.find((l) => l.channel === channel);
            const label = channel === "shopee" ? "Shopee" : "TikTok Shop";
            return (
              <div
                key={channel}
                className="flex flex-col gap-2 rounded-xl border border-[var(--admin-line)] p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-[var(--admin-muted)]">
                    {link
                      ? `${link.status}${link.externalItemId ? ` · ${link.externalItemId}` : ""}`
                      : "não vinculado"}
                    {link?.lastError ? ` · ${link.lastError}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {link?.status === "listed" ? (
                    <>
                      <AdminButton
                        type="button"
                        variant="secondary"
                        disabled={Boolean(busy)}
                        onClick={() => void syncChannel(channel, "stock")}
                      >
                        {busy === `${channel}-stock` ? (
                          <AdminSpinner />
                        ) : null}
                        Estoque
                      </AdminButton>
                      <AdminButton
                        type="button"
                        variant="secondary"
                        disabled={Boolean(busy)}
                        onClick={() => void syncChannel(channel, "full")}
                      >
                        {busy === `${channel}-full` ? <AdminSpinner /> : null}
                        Preço+Estoque
                      </AdminButton>
                    </>
                  ) : (
                    <AdminButton
                      type="button"
                      disabled={Boolean(busy)}
                      onClick={() => void exportTo(channel)}
                    >
                      {busy === `export-${channel}` ? <AdminSpinner /> : null}
                      Publicar
                    </AdminButton>
                  )}
                </div>
              </div>
            );
          })}
          {message ? (
            <p className="text-sm text-[var(--admin-muted)]">{message}</p>
          ) : null}
        </div>
      )}
    </AdminPanel>
  );
}
