import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { listAllOrders } from "@/lib/orders/service";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const orders = await listAllOrders();
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao listar pedidos",
      },
      { status: 500 }
    );
  }
}
