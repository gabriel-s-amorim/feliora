import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { configureBrevoWebhooks } from "@/lib/brevo/service";

export async function POST() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    return NextResponse.json(await configureBrevoWebhooks());
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Falha ao configurar webhook",
      },
      { status: 400 }
    );
  }
}
