"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { AdminShell, RequireAdmin } from "@/components/admin/AdminShell";
import { AdminSpinner } from "@/components/admin/ui";
import type { BrevoAdminStatus, StoreEmailEvent } from "@/shared/types/brevo";
import type { MercadoPagoAdminStatus } from "@/shared/types/mercadoPago";
import type { MelhorEnvioStatus } from "@/shared/types/melhorEnvio";

type MeStatus = MelhorEnvioStatus & { suggestedRedirectUri?: string };

const STORE_TEMPLATE_LABELS: Record<StoreEmailEvent, string> = {
  order_received: "Pedido criado (cliente)",
  order_received_merchant: "Pedido criado (loja)",
  payment_approved: "Pagamento aprovado",
};

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

function BrevoCard() {
  const [status, setStatus] = useState<BrevoAdminStatus | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [webhookToken, setWebhookToken] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [merchantEmail, setMerchantEmail] = useState("");
  const [listId, setListId] = useState("");
  const [templateShipped, setTemplateShipped] = useState("");
  const [templateProcessing, setTemplateProcessing] = useState("");
  const [templateDelivered, setTemplateDelivered] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [testEvent, setTestEvent] =
    useState<StoreEmailEvent>("order_received");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/brevo");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      setStatus(data);
      setEnabled(Boolean(data.enabled));
      setSenderEmail(data.defaultSenderEmail ?? "");
      setSenderName(data.defaultSenderName ?? "");
      setReplyTo(data.replyTo ?? "");
      setMerchantEmail(data.merchantNotifyEmail ?? "");
      setListId(data.defaultListId ? String(data.defaultListId) : "");
      setTemplateProcessing(
        data.templateOrderProcessing
          ? String(data.templateOrderProcessing)
          : ""
      );
      setTemplateShipped(
        data.templateOrderShipped ? String(data.templateOrderShipped) : ""
      );
      setTemplateDelivered(
        data.templateOrderDelivered ? String(data.templateOrderDelivered) : ""
      );
      setApiKey("");
      setWebhookToken("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao carregar Brevo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/brevo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          apiKey: apiKey || undefined,
          webhookToken: webhookToken || undefined,
          defaultSenderEmail: senderEmail,
          defaultSenderName: senderName,
          replyTo,
          merchantNotifyEmail: merchantEmail,
          defaultListId: listId ? Number(listId) : null,
          templateOrderProcessing: templateProcessing
            ? Number(templateProcessing)
            : null,
          templateOrderShipped: templateShipped
            ? Number(templateShipped)
            : null,
          templateOrderDelivered: templateDelivered
            ? Number(templateDelivered)
            : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar");
      setStatus(data);
      setMessage("Brevo salvo.");
      setApiKey("");
      setWebhookToken("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function testCredentials() {
    setMessage(null);
    const res = await fetch("/api/admin/brevo", { method: "POST" });
    const data = await res.json();
    setMessage(
      res.ok
        ? `Credenciais OK${data.accountEmail ? ` (${data.accountEmail})` : ""}.`
        : (data.error ?? "Falha no teste")
    );
    if (res.ok) void load();
  }

  async function configureWebhook() {
    setMessage(null);
    const res = await fetch("/api/admin/brevo/webhook", { method: "POST" });
    const data = await res.json();
    setMessage(
      res.ok
        ? `Webhook configurado: ${data.webhookUrl}`
        : (data.error ?? "Falha no webhook")
    );
  }

  async function sendTestTemplate() {
    if (!testEmail.trim()) {
      setMessage("Informe um e-mail para o teste.");
      return;
    }
    setMessage(null);
    const res = await fetch("/api/admin/brevo/test-template", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: testEvent, email: testEmail.trim() }),
    });
    const data = await res.json();
    setMessage(
      res.ok
        ? "E-mail de teste enviado."
        : (data.error ?? "Falha no envio de teste")
    );
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Brevo</h2>
          <p className="mt-1 text-sm text-zinc-500">
            E-mails transacionais, tracking de envio e newsletter.
          </p>
        </div>
        {status ? (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              status.enabled && status.configured
                ? "bg-emerald-50 text-emerald-700"
                : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {status.enabled && status.configured ? "Ativo" : "Inativo"}
          </span>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-zinc-500">
          <AdminSpinner /> Carregando…
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            Habilitado
          </label>
          <label className="sm:col-span-2 text-sm">
            API key {status?.hasApiKey ? "(já salva — deixe em branco para manter)" : ""}
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
              placeholder="xkeysib-…"
              autoComplete="off"
            />
          </label>
          <label className="text-sm">
            Remetente (e-mail)
            <input
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Remetente (nome)
            <input
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Reply-to
            <input
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            E-mail da loja (novos pedidos)
            <input
              value={merchantEmail}
              onChange={(e) => setMerchantEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            List ID newsletter
            <input
              value={listId}
              onChange={(e) => setListId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
              placeholder="opcional"
            />
          </label>
          <label className="text-sm">
            Webhook token (≥32 chars)
            <input
              type="password"
              value={webhookToken}
              onChange={(e) => setWebhookToken(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
              placeholder={
                status?.hasWebhookToken ? "já salvo" : "token Bearer"
              }
              autoComplete="off"
            />
          </label>
          <label className="text-sm">
            Template ID — em preparação
            <input
              value={templateProcessing}
              onChange={(e) => setTemplateProcessing(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
              placeholder="opcional (fallback HTML)"
            />
          </label>
          <label className="text-sm">
            Template ID — enviado
            <input
              value={templateShipped}
              onChange={(e) => setTemplateShipped(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
              placeholder="opcional (fallback HTML)"
            />
          </label>
          <label className="text-sm">
            Template ID — entregue
            <input
              value={templateDelivered}
              onChange={(e) => setTemplateDelivered(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
              placeholder="opcional (fallback HTML)"
            />
          </label>
          {status?.webhookUrl ? (
            <p className="sm:col-span-2 text-xs text-zinc-500">
              Webhook URL:{" "}
              <code className="rounded bg-zinc-100 px-1">{status.webhookUrl}</code>
            </p>
          ) : null}
          <div className="sm:col-span-2 grid gap-2 rounded-lg border border-zinc-100 bg-zinc-50 p-3 sm:grid-cols-[1fr_1fr_auto]">
            <select
              value={testEvent}
              onChange={(e) =>
                setTestEvent(e.target.value as StoreEmailEvent)
              }
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
            >
              {(Object.keys(STORE_TEMPLATE_LABELS) as StoreEmailEvent[]).map(
                (event) => (
                  <option key={event} value={event}>
                    {STORE_TEMPLATE_LABELS[event]}
                  </option>
                )
              )}
            </select>
            <input
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
              placeholder="e-mail para teste"
            />
            <button
              type="button"
              onClick={() => void sendTestTemplate()}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
            >
              Testar template
            </button>
          </div>
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
          Testar API
        </button>
        <button
          type="button"
          onClick={() => void configureWebhook()}
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50"
        >
          Configurar webhook
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
      <BrevoCard />
    </div>
  );
}

export default function AdminIntegracoesPage() {
  return (
    <RequireAdmin>
      <AdminShell
        title="Integrações"
        description="Mercado Pago, Melhor Envio e Brevo — credenciais criptografadas no banco."
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
