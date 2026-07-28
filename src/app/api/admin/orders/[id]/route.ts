import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { getOrderById } from "@/lib/orders/service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;
    const order = await getOrderById(id);
    return NextResponse.json(order);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao carregar pedido";
    const status =
      message.includes("not found") || message.includes("0 rows") ? 404 : 500;
    return NextResponse.json(
      { error: status === 404 ? "Pedido não encontrado" : message },
      { status }
    );
  }
}
