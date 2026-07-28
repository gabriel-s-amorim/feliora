import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { updateOrderFulfillment } from "@/lib/orders/service";
import { fulfillmentUpdateSchema } from "@/shared/schemas/order";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = fulfillmentUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const { id } = await params;
    const order = await updateOrderFulfillment(id, parsed.data);
    return NextResponse.json(order);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao atualizar fulfillment";
    const status =
      message.includes("não encontrado") || message.includes("0 rows")
        ? 404
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
