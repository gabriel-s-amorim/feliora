import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { getPublicAppUrl } from "@/lib/mercadoPago/service";
import { buildShopeeAuthorizeUrl } from "@/lib/marketplace/shopee/client";
import { buildTikTokAuthorizeUrl } from "@/lib/marketplace/tiktok/client";
import type { MarketplaceChannel } from "@/shared/types/marketplace";

function adminIntegrationsUrl(query: Record<string, string>): string {
  const origin = getPublicAppUrl();
  const params = new URLSearchParams(query);
  return `${origin}/admin/integracoes?${params.toString()}`;
}

function parseChannel(raw: string): MarketplaceChannel | null {
  if (raw === "shopee" || raw === "tiktok") return raw;
  return null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ channel: string }> }
) {
  const auth = await requireAdmin();
  const { channel: raw } = await context.params;
  const channel = parseChannel(raw);

  if ("error" in auth) {
    return NextResponse.redirect(
      adminIntegrationsUrl({ mkt_error: "Faça login no admin" })
    );
  }
  if (!channel) {
    return NextResponse.redirect(
      adminIntegrationsUrl({ mkt_error: "Canal inválido" })
    );
  }

  try {
    const url =
      channel === "shopee"
        ? await buildShopeeAuthorizeUrl()
        : await buildTikTokAuthorizeUrl();
    return NextResponse.redirect(url);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao iniciar autorização";
    return NextResponse.redirect(
      adminIntegrationsUrl({ mkt_error: message, mkt_channel: channel })
    );
  }
}
