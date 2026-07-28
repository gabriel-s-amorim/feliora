import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import {
  getMercadoPagoAdminStatus,
  testMercadoPagoCredentials,
  updateMercadoPagoSettings,
} from "@/lib/mercadoPago/service";
import { mercadoPagoSettingsSchema } from "@/shared/schemas/mercadoPago";
import type { MercadoPagoEnvironment } from "@/shared/types/mercadoPago";

function environmentFrom(value: unknown): MercadoPagoEnvironment {
  return value === "production" ? "production" : "test";
}

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const status = await getMercadoPagoAdminStatus(
      environmentFrom(searchParams.get("environment"))
    );
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro ao carregar",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = mercadoPagoSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  try {
    return NextResponse.json(await updateMercadoPagoSettings(parsed.data));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao salvar" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json().catch(() => ({}));
    return NextResponse.json(
      await testMercadoPagoCredentials(environmentFrom(body?.environment))
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Credenciais inválidas",
      },
      { status: 400 }
    );
  }
}
