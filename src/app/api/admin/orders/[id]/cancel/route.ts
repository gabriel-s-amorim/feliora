import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { cancelOrder } from "@/lib/orders/service";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;
    const order = await cancelOrder(id);
    return NextResponse.json(order);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao cancelar pedido";
    const status = message.includes("não encontrado")
      ? 404
      : message.includes("entregue")
        ? 409
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
