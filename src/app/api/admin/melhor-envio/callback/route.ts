import { NextResponse } from "next/server";
import { exchangeAuthorizationCode } from "@/lib/melhorEnvio/service";
import { getPublicAppUrl } from "@/lib/mercadoPago/service";

function adminIntegrationsUrl(query: Record<string, string>): string {
  const origin = getPublicAppUrl();
  const params = new URLSearchParams(query);
  return `${origin}/admin/integracoes?${params.toString()}`;
}

/** Callback OAuth — valida state assinado; não exige cookie admin. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code") ?? "";
    const state = searchParams.get("state") ?? "";
    const errorParam = searchParams.get("error") ?? "";

    if (errorParam) {
      const description =
        searchParams.get("error_description") ?? errorParam;
      return NextResponse.redirect(
        adminIntegrationsUrl({ me_error: description })
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        adminIntegrationsUrl({ me_error: "Código de autorização ausente" })
      );
    }

    await exchangeAuthorizationCode(code, state);
    return NextResponse.redirect(
      adminIntegrationsUrl({ me_connected: "1" })
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha na autorização";
    return NextResponse.redirect(
      adminIntegrationsUrl({ me_error: message })
    );
  }
}
