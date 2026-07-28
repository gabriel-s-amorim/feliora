"use client";

import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminShell, RequireAdmin } from "@/components/admin/AdminShell";
import {
  AdminAlert,
  AdminButton,
  AdminField,
  AdminInput,
  AdminPanel,
  AdminSpinner,
} from "@/components/admin/ui";
import {
  AdminApiError,
  adminGetSettings,
  adminUpdateSettings,
} from "@/lib/admin/client";
import { DEFAULT_STORE_SETTINGS } from "@/shared/types/storeSettings";

export default function AdminSettingsPage() {
  const [form, setForm] = useState(DEFAULT_STORE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await adminGetSettings();
        if (!cancelled) setForm(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof AdminApiError
              ? err.message
              : "Erro ao carregar settings"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const saved = await adminUpdateSettings({
        contactEmail: form.contactEmail,
        whatsappNumber: form.whatsappNumber,
        whatsappDisplay: form.whatsappDisplay,
        addressLine: form.addressLine,
        instagramUrl: form.instagramUrl,
        facebookUrl: form.facebookUrl,
        tiktokUrl: form.tiktokUrl,
        twitterUrl: form.twitterUrl,
      });
      setForm(saved);
      setMessage("Settings salvos com sucesso.");
    } catch (err) {
      setError(
        err instanceof AdminApiError ? err.message : "Erro ao salvar settings"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <RequireAdmin>
      <AdminShell
        title="Settings"
        description="Contato, WhatsApp e redes sociais exibidos na loja."
      >
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-[var(--admin-muted)]">
            <AdminSpinner />
            Carregando…
          </div>
        ) : (
          <AdminPanel
            title="Contato & redes"
            description="Esses dados alimentam footer e canais de atendimento."
            className="max-w-2xl"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {(
                [
                  ["contactEmail", "E-mail de contato"],
                  ["whatsappNumber", "WhatsApp (só dígitos)"],
                  ["whatsappDisplay", "WhatsApp (exibição)"],
                  ["addressLine", "Endereço / cidade"],
                  ["instagramUrl", "Instagram URL"],
                  ["facebookUrl", "Facebook URL"],
                  ["tiktokUrl", "TikTok URL"],
                  ["twitterUrl", "X / Twitter URL"],
                ] as const
              ).map(([key, label]) => (
                <AdminField key={key} label={label}>
                  <AdminInput
                    type={key === "contactEmail" ? "email" : "text"}
                    value={form[key]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [key]: e.target.value }))
                    }
                  />
                </AdminField>
              ))}

              {error ? <AdminAlert>{error}</AdminAlert> : null}
              {message ? (
                <AdminAlert tone="success">{message}</AdminAlert>
              ) : null}

              <AdminButton type="submit" disabled={saving}>
                {saving ? <AdminSpinner /> : <Save className="size-4" />}
                {saving ? "Salvando…" : "Salvar settings"}
              </AdminButton>
            </form>
          </AdminPanel>
        )}
      </AdminShell>
    </RequireAdmin>
  );
}
