import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { deleteCanceledOrders, listAllOrders } from "@/lib/orders/service";
import { deleteOrdersSchema } from "@/shared/schemas/order";

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

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const parsed = deleteOrdersSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  try {
    const deleted = await deleteCanceledOrders(parsed.data.orderIds);
    return NextResponse.json({ deleted });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao excluir pedidos";
    const status = message.includes("Somente pedidos cancelados") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
