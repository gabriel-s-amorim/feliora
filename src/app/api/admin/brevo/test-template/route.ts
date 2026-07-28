import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { sendOrderTemplateTest } from "@/lib/brevo/orderEmails";
import { brevoTemplateTestSchema } from "@/shared/schemas/brevo";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = brevoTemplateTestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  try {
    const result = await sendOrderTemplateTest(parsed.data);
    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Falha no teste",
      },
      { status: 400 }
    );
  }
}
