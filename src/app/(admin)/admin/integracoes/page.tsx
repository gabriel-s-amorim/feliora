"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { AdminShell, RequireAdmin } from "@/components/admin/AdminShell";
import { AdminSpinner } from "@/components/admin/ui";
import type { MercadoPagoAdminStatus } from "@/shared/types/mercadoPago";
import type { MelhorEnvioStatus } from "@/shared/types/melhorEnvio";

type MeStatus = MelhorEnvioStatus & { suggestedRedirectUri?: string };

function MercadoPagoCard() {
  const [environment, setEnvironment] = useState<"test" | "production">(
    "test"
  );
  const [status, setStatus] = useState<MercadoPagoAdminStatus | null>(null);
  const [publicKey, setPublicKey] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [pixEnabled, setPixEnabled] = useState(true);
  const [boletoEnabled, setBoletoEnabled] = useState(true);
  const [creditCardEnabled, setCreditCardEnabled] = useState(true);
  const [maxInstallments, setMaxInstallments] = useState(12);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/mercado-pago?environment=${environment}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      setStatus(data);
      setPublicKey(data.publicKey ?? "");
      setEnabled(Boolean(data.enabled));
      setPixEnabled(Boolean(data.pixEnabled));
      setBoletoEnabled(Boolean(data.boletoEnabled));
      setCreditCardEnabled(Boolean(data.creditCardEnabled));
      setMaxInstallments(Number(data.maxInstallments) || 12);
      setAccessToken("");
      setWebhookSecret("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao carregar MP");
    } finally {
      setLoading(false);
    }
  }, [environment]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/mercado-pago", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          environment,
          enabled,
          publicKey,
          accessToken: accessToken || undefined,
          webhookSecret: webhookSecret || undefined,
          pixEnabled,
          boletoEnabled,
          creditCardEnabled,
          maxInstallments,
          boletoExpirationDays: status?.boletoExpirationDays ?? 3,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar");
      setStatus(data);
      setMessage("Mercado Pago salvo.");
      setAccessToken("");
      setWebhookSecret("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function testCredentials() {
    setMessage(null);
    const res = await fetch("/api/admin/mercado-pago", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ environment }),
    });
    const data = await res.json();
    setMessage(
      res.ok
        ? "Credenciais OK."
        : data.error ?? "Falha no teste de credenciais"
    );
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">
            Mercado Pago
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Checkout transparente (Orders API). Webhook:{" "}
            <code className="text-xs">{status?.webhookUrl}</code>
          </p>
        </div>
        <select
          value={environment}
          onChange={(e) =>
            setEnvironment(e.target.value as "test" | "production")
          }
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
        >
          <option value="test">Sandbox (test)</option>
          <option value="production">Produção</option>
        </select>
      </div>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-zinc-500">
          <AdminSpinner /> Carregando…
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            Ambiente ativo
          </label>
          <label className="sm:col-span-2 text-sm">
            Public Key
            <input
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Access Token{" "}
            {status?.hasAccessToken ? (
              <span className="text-xs text-emerald-600">(salvo)</span>
            ) : null}
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Deixe em branco para manter"
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Webhook Secret{" "}
            {status?.hasWebhookSecret ? (
              <span className="text-xs text-emerald-600">(salvo)</span>
            ) : null}
            <input
              type="password"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              placeholder="Deixe em branco para manter"
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={pixEnabled}
              onChange={(e) => setPixEnabled(e.target.checked)}
            />
            Pix
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={creditCardEnabled}
              onChange={(e) => setCreditCardEnabled(e.target.checked)}
            />
            Cartão
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={boletoEnabled}
              onChange={(e) => setBoletoEnabled(e.target.checked)}
            />
            Boleto
          </label>
          <label className="text-sm">
            Máx. parcelas
            <input
              type="number"
              min={1}
              max={12}
              value={maxInstallments}
              onChange={(e) => setMaxInstallments(Number(e.target.value) || 1)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
            />
          </label>
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
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar"}
        </button>
        <button
          type="button"
          onClick={() => void testCredentials()}
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50"
        >
          Testar token
        </button>
      </div>
    </section>
  );
}

function MelhorEnvioCard() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<MeStatus | null>(null);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [originPostalCode, setOriginPostalCode] = useState("");
  const [userAgent, setUserAgent] = useState("");
  const [redirectUri, setRedirectUri] = useState("");
  const [environment, setEnvironment] = useState<"production" | "sandbox">(
    "sandbox"
  );
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/melhor-envio");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      setStatus(data);
      setClientId(data.clientId ?? "");
      setOriginPostalCode(data.originPostalCode ?? "");
      setUserAgent(data.userAgent ?? "");
      setRedirectUri(data.redirectUri || data.suggestedRedirectUri || "");
      setEnvironment(data.environment ?? "sandbox");
      setClientSecret("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao carregar ME");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const connected = searchParams.get("me_connected");
    const err = searchParams.get("me_error");
    if (connected) setMessage("Melhor Envio conectado com sucesso.");
    if (err) setMessage(err);
  }, [searchParams]);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/melhor-envio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          environment,
          clientId,
          clientSecret: clientSecret || undefined,
          originPostalCode,
          userAgent,
          redirectUri,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar");
      setStatus(data);
      setMessage("Melhor Envio salvo.");
      setClientSecret("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function disconnect() {
    const res = await fetch("/api/admin/melhor-envio", { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Erro ao desconectar");
      return;
    }
    setStatus(data);
    setMessage("Desconectado.");
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="text-base font-semibold text-zinc-900">Melhor Envio</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Status:{" "}
        {status?.connected ? (
          <span className="text-emerald-600">conectado</span>
        ) : (
          <span className="text-amber-600">não conectado</span>
        )}
        {status?.suggestedRedirectUri ? (
          <>
            {" "}
            · Callback sugerido:{" "}
            <code className="text-xs">{status.suggestedRedirectUri}</code>
          </>
        ) : null}
      </p>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-zinc-500">
          <AdminSpinner /> Carregando…
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Ambiente
            <select
              value={environment}
              onChange={(e) =>
                setEnvironment(e.target.value as "production" | "sandbox")
              }
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
            >
              <option value="sandbox">Sandbox</option>
              <option value="production">Produção</option>
            </select>
          </label>
          <label className="text-sm">
            CEP origem
            <input
              value={originPostalCode}
              onChange={(e) => setOriginPostalCode(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Client ID
            <input
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Client Secret{" "}
            {status?.hasClientSecret ? (
              <span className="text-xs text-emerald-600">(salvo)</span>
            ) : null}
            <input
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="Deixe em branco para manter"
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
            />
          </label>
          <label className="sm:col-span-2 text-sm">
            Redirect URI
            <input
              value={redirectUri}
              onChange={(e) => setRedirectUri(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
            />
          </label>
          <label className="sm:col-span-2 text-sm">
            User-Agent
            <input
              value={userAgent}
              onChange={(e) => setUserAgent(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
            />
          </label>
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
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar"}
        </button>
        <a
          href="/api/admin/melhor-envio/connect"
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50"
        >
          Conectar OAuth
        </a>
        <button
          type="button"
          onClick={() => void disconnect()}
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          Desconectar
        </button>
      </div>
    </section>
  );
}

function IntegracoesContent() {
  return (
    <div className="space-y-6">
      <MercadoPagoCard />
      <MelhorEnvioCard />
    </div>
  );
}

export default function AdminIntegracoesPage() {
  return (
    <RequireAdmin>
      <AdminShell
        title="Integrações"
        description="Mercado Pago e Melhor Envio — credenciais criptografadas no banco."
      >
        <Suspense
          fallback={
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <AdminSpinner /> Carregando…
            </div>
          }
        >
          <IntegracoesContent />
        </Suspense>
      </AdminShell>
    </RequireAdmin>
  );
}
