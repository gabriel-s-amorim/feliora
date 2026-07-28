/**
 * Origem pública do site — evita metadataBase apontar para domínio placeholder
 * enquanto o deploy está em *.vercel.app.
 */
export function getSiteOrigin(fallback: string): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    (process.env.VERCEL_URL?.trim()
      ? `https://${process.env.VERCEL_URL.trim()}`
      : "") ||
    fallback;
  const withProtocol = raw.startsWith("http") ? raw : `https://${raw}`;
  return withProtocol.replace(/\/$/, "");
}
