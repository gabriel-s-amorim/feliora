import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { buildAuthorizeUrl } from "@/lib/melhorEnvio/service";
import { getPublicAppUrl } from "@/lib/mercadoPago/service";

function adminIntegrationsUrl(query: Record<string, string>): string {
  const origin = getPublicAppUrl();
  const params = new URLSearchParams(query);
  return `${origin}/admin/integracoes?${params.toString()}`;
}

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.redirect(
      adminIntegrationsUrl({ me_error: "Faça login no admin" })
    );
  }

  try {
    const url = await buildAuthorizeUrl();
    return NextResponse.redirect(url);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao iniciar autorização";
    return NextResponse.redirect(adminIntegrationsUrl({ me_error: message }));
  }
}
