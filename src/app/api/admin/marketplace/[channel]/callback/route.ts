import { NextResponse } from "next/server";
import { getPublicAppUrl } from "@/lib/mercadoPago/service";
import { exchangeShopeeCode } from "@/lib/marketplace/shopee/client";
import { exchangeTikTokCode } from "@/lib/marketplace/tiktok/client";
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
  request: Request,
  context: { params: Promise<{ channel: string }> }
) {
  const { channel: raw } = await context.params;
  const channel = parseChannel(raw);
  if (!channel) {
    return NextResponse.redirect(
      adminIntegrationsUrl({ mkt_error: "Canal inválido" })
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const errorParam =
      searchParams.get("error") ?? searchParams.get("error_description") ?? "";
    if (errorParam) {
      return NextResponse.redirect(
        adminIntegrationsUrl({ mkt_error: errorParam, mkt_channel: channel })
      );
    }

    const code = searchParams.get("code") ?? searchParams.get("auth_code") ?? "";
    const state = searchParams.get("state") ?? "";
    const shopId = searchParams.get("shop_id") ?? "";

    if (!code || !state) {
      return NextResponse.redirect(
        adminIntegrationsUrl({
          mkt_error: "Código de autorização ausente",
          mkt_channel: channel,
        })
      );
    }

    if (channel === "shopee") {
      if (!shopId) {
        return NextResponse.redirect(
          adminIntegrationsUrl({
            mkt_error: "shop_id ausente no callback Shopee",
            mkt_channel: channel,
          })
        );
      }
      await exchangeShopeeCode(code, shopId, state);
    } else {
      await exchangeTikTokCode(code, state);
    }

    return NextResponse.redirect(
      adminIntegrationsUrl({ mkt_connected: channel })
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha na autorização";
    return NextResponse.redirect(
      adminIntegrationsUrl({ mkt_error: message, mkt_channel: channel })
    );
  }
}
