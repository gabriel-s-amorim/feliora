import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import {
  getBrevoAdminStatus,
  testBrevoCredentials,
  updateBrevoSettings,
} from "@/lib/brevo/service";
import { brevoSettingsSchema } from "@/shared/schemas/brevo";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    return NextResponse.json(await getBrevoAdminStatus());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao carregar" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = brevoSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  try {
    return NextResponse.json(await updateBrevoSettings(parsed.data));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao salvar" },
      { status: 500 }
    );
  }
}

export async function POST() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    return NextResponse.json(await testBrevoCredentials());
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
