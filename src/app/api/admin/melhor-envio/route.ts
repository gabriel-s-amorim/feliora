import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import {
  disconnectMelhorEnvio,
  getDefaultRedirectUri,
  getMelhorEnvioStatus,
  updateMelhorEnvioSettings,
} from "@/lib/melhorEnvio/service";
import { melhorEnvioSettingsSchema } from "@/shared/schemas/melhorEnvio";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const status = await getMelhorEnvioStatus();
    return NextResponse.json({
      ...status,
      suggestedRedirectUri: getDefaultRedirectUri(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao carregar Melhor Envio",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const parsed = melhorEnvioSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.issues },
        { status: 400 }
      );
    }
    const status = await updateMelhorEnvioSettings(parsed.data);
    return NextResponse.json({
      ...status,
      suggestedRedirectUri: getDefaultRedirectUri(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao salvar Melhor Envio",
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const status = await disconnectMelhorEnvio();
    return NextResponse.json({
      ...status,
      suggestedRedirectUri: getDefaultRedirectUri(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao desconectar Melhor Envio",
      },
      { status: 500 }
    );
  }
}
