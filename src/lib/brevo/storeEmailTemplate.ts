export type OrderEmailParams = Record<string, unknown> & {
  ITEMS?: Array<{
    name?: string;
    quantity?: number;
    price?: string;
    size?: string;
    color?: string;
  }>;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Linhas de itens para e-mail (tabela compatível com clientes de e-mail). */
export function buildItemsHtml(items: OrderEmailParams["ITEMS"]): string {
  if (!items?.length) {
    return `<tr><td style="padding:14px 0;font-family:Georgia,'Times New Roman',serif;font-size:14px;color:#6B5E52;">Nenhum item</td></tr>`;
  }

  return items
    .map((item, index) => {
      const name = escapeHtml(item.name ?? "Item");
      const qty = Number(item.quantity ?? 1);
      const price = escapeHtml(item.price ?? "");
      const meta = [item.size ? `Tam. ${item.size}` : "", item.color ?? ""]
        .filter(Boolean)
        .map(escapeHtml)
        .join(" · ");
      const border =
        index === items.length - 1
          ? "border-bottom:none;"
          : "border-bottom:1px solid rgba(183,110,121,0.18);";

      return `<tr>
  <td style="padding:14px 0;${border}vertical-align:top;">
    <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.4;color:#2C241B;">${name}</p>
    ${
      meta
        ? `<p style="margin:4px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.04em;color:#8C7B6A;">${meta}</p>`
        : ""
    }
  </td>
  <td style="padding:14px 0 14px 16px;${border}vertical-align:top;text-align:right;white-space:nowrap;">
    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#6B5E52;">${qty}×</p>
    <p style="margin:4px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:14px;color:#2C241B;">${price}</p>
  </td>
</tr>`;
    })
    .join("");
}

/** Substitui {{VAR}} e monta {{ITEMS_HTML}} a partir dos params do pedido. */
export function renderStoreEmailTemplate(
  template: string,
  params: OrderEmailParams
): string {
  const values: Record<string, string> = {
    ITEMS_HTML: buildItemsHtml(params.ITEMS),
  };
  for (const [key, value] of Object.entries(params)) {
    if (key === "ITEMS") continue;
    values[key] = value == null ? "" : String(value);
  }
  return template.replace(
    /\{\{\s*([A-Z0-9_]+)\s*\}\}/g,
    (_match, key: string) => values[key] ?? ""
  );
}

/** Envelope visual Feliora reutilizável nos fallbacks de fulfillment. */
export function wrapFelioraEmail(options: {
  eyebrow?: string;
  title: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
}): string {
  const cta =
    options.ctaLabel && options.ctaUrl
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
  <tr>
    <td style="background:#B76E79;">
      <a href="${escapeHtml(options.ctaUrl)}" style="display:inline-block;padding:14px 26px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;text-decoration:none;color:#FDF8F4;">${escapeHtml(options.ctaLabel)}</a>
    </td>
  </tr>
</table>`
      : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:0;background:#F7F0E8;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F0E8;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FDF8F4;border:1px solid rgba(183,110,121,0.2);">
          <tr>
            <td style="padding:28px 28px 8px;text-align:center;border-bottom:1px solid rgba(183,110,121,0.15);">
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:13px;letter-spacing:0.42em;text-transform:uppercase;color:#B76E79;">Feliora</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px 36px;">
              ${
                options.eyebrow
                  ? `<p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#8C7B6A;">${escapeHtml(options.eyebrow)}</p>`
                  : ""
              }
              <h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;letter-spacing:0.04em;line-height:1.25;color:#2C241B;">${escapeHtml(options.title)}</h1>
              ${options.bodyHtml}
              ${cta}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px;border-top:1px solid rgba(183,110,121,0.15);text-align:center;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:#8C7B6A;">Moda feminina com delicadeza · Feliora</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
