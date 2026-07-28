"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminSpinner } from "@/components/admin/ui";
import type {
  MarketplaceChannel,
  MarketplaceChannelStatus,
} from "@/shared/types/marketplace";

export function MarketplaceChannelCard({
  channel,
}: {
  channel: MarketplaceChannel;
}) {
  const title = channel === "shopee" ? "Shopee" : "TikTok Shop";
  const [status, setStatus] = useState<MarketplaceChannelStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [partnerId, setPartnerId] = useState("");
  const [partnerKey, setPartnerKey] = useState("");
  const [appKey, setAppKey] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [enabled, setEnabled] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/marketplace/${channel}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      setStatus(data);
      setPartnerId(data.partnerId ?? "");
      setAppKey(data.appKey ?? "");
      setServiceId(data.serviceId ?? "");
      setWarehouseId(data.warehouseId ?? "");
      setEnabled(Boolean(data.enabled));
      setPartnerKey("");
      setAppSecret("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [channel]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const body =
        channel === "shopee"
          ? {
              enabled,
              partnerId,
              partnerKey: partnerKey || undefined,
            }
          : {
              enabled,
              appKey,
              appSecret: appSecret || undefined,
              serviceId,
              warehouseId,
            };
      const res = await fetch(`/api/admin/marketplace/${channel}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar");
      setStatus(data);
      setPartnerKey("");
      setAppSecret("");
      setMessage(`${title} salvo.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function disconnect() {
    const res = await fetch(`/api/admin/marketplace/${channel}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Erro ao desconectar");
      return;
    }
    setStatus(data);
    setMessage("Desconectado.");
  }

  function copyWebhook() {
    if (!status?.webhookUrl) return;
    void navigator.clipboard.writeText(status.webhookUrl);
    setMessage("Webhook URL copiada.");
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Status:{" "}
            {status?.connected ? (
              <span className="text-emerald-600">conectado</span>
            ) : (
              <span className="text-amber-600">não conectado</span>
            )}
            {status?.shopName ? ` · ${status.shopName}` : null}
            {status?.shopId ? (
              <span className="text-xs"> · shop {status.shopId}</span>
            ) : null}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-600">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          Ativo
        </label>
      </div>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-zinc-500">
          <AdminSpinner /> Carregando…
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {channel === "shopee" ? (
            <>
              <label className="text-sm">
                Partner ID
                <input
                  value={partnerId}
                  onChange={(e) => setPartnerId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
                />
              </label>
              <label className="text-sm">
                Partner Key{" "}
                {status?.hasPartnerKey ? (
                  <span className="text-xs text-emerald-600">(salvo)</span>
                ) : null}
                <input
                  type="password"
                  value={partnerKey}
                  onChange={(e) => setPartnerKey(e.target.value)}
                  placeholder="Deixe em branco para manter"
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
                />
              </label>
            </>
          ) : (
            <>
              <label className="text-sm">
                App Key
                <input
                  value={appKey}
                  onChange={(e) => setAppKey(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
                />
              </label>
              <label className="text-sm">
                App Secret{" "}
                {status?.hasAppSecret ? (
                  <span className="text-xs text-emerald-600">(salvo)</span>
                ) : null}
                <input
                  type="password"
                  value={appSecret}
                  onChange={(e) => setAppSecret(e.target.value)}
                  placeholder="Deixe em branco para manter"
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
                />
              </label>
              <label className="text-sm">
                Service ID
                <input
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
                />
              </label>
              <label className="text-sm">
                Warehouse ID
                <input
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
                  placeholder="Obrigatório para export/estoque"
                />
              </label>
            </>
          )}
          {status?.suggestedRedirectUri ? (
            <p className="sm:col-span-2 text-xs text-zinc-500">
              Redirect URI:{" "}
              <code className="rounded bg-zinc-100 px-1 break-all">
                {status.suggestedRedirectUri}
              </code>
            </p>
          ) : null}
          {status?.webhookUrl ? (
            <p className="sm:col-span-2 text-xs text-zinc-500">
              Webhook:{" "}
              <code className="rounded bg-zinc-100 px-1 break-all">
                {status.webhookUrl}
              </code>{" "}
              <button
                type="button"
                onClick={copyWebhook}
                className="text-rose-gold underline"
              >
                Copiar
              </button>
            </p>
          ) : null}
          {status?.lastError ? (
            <p className="sm:col-span-2 text-sm text-red-600">
              {status.lastError}
            </p>
          ) : null}
        </div>
      )}

      {message ? (
        <p className="mt-3 text-sm text-zinc-600">{message}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="min-h-11 rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar"}
        </button>
        <a
          href={`/api/admin/marketplace/${channel}/connect`}
          className="inline-flex min-h-11 items-center rounded-lg border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50"
        >
          Conectar loja
        </a>
        <button
          type="button"
          onClick={() => void disconnect()}
          className="min-h-11 rounded-lg border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50"
        >
          Desconectar
        </button>
      </div>
    </section>
  );
}
