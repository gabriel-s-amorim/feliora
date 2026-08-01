import { createAdminClient } from "@/lib/supabase/admin";
import {
  getPublicAppUrl,
  sendBrevoTransactionalEmail,
} from "@/lib/brevo/service";
import { wrapFelioraEmail } from "@/lib/brevo/storeEmailTemplate";

const SUCCESS_MESSAGE =
  "Se este e-mail estiver cadastrado, você receberá um link para redefinir a senha.";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function requestPasswordReset(email: string): Promise<{
  ok: true;
  message: string;
}> {
  const normalized = email.trim().toLowerCase();
  const appUrl = getPublicAppUrl();
  const redirectTo = `${appUrl}/auth/callback?next=${encodeURIComponent("/conta/redefinir-senha")}`;

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: normalized,
    options: { redirectTo },
  });

  if (error || !data?.properties?.hashed_token) {
    // Não revela se o e-mail existe
    return { ok: true, message: SUCCESS_MESSAGE };
  }

  const resetUrl = new URL(`${appUrl}/conta/redefinir-senha`);
  resetUrl.searchParams.set("token_hash", data.properties.hashed_token);
  resetUrl.searchParams.set("type", "recovery");

  const htmlContent = wrapFelioraEmail({
    eyebrow: "Conta",
    title: "Redefinir sua senha",
    bodyHtml: `<p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.6;color:#6B5E52;">Recebemos um pedido para redefinir a senha da conta <strong style="color:#2C241B;">${escapeHtml(normalized)}</strong>.</p>
<p style="margin:16px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.6;color:#6B5E52;">O link é válido por tempo limitado. Se você não solicitou esta alteração, ignore este e-mail.</p>`,
    ctaLabel: "Redefinir senha",
    ctaUrl: resetUrl.toString(),
  });

  await sendBrevoTransactionalEmail(
    {
      to: [{ email: normalized }],
      subject: "Redefinir senha — Feliora",
      htmlContent,
      tags: ["password-reset", "auth"],
    },
    "transactional"
  );

  return { ok: true, message: SUCCESS_MESSAGE };
}
