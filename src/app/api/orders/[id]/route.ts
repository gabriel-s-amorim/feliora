import { NextResponse } from "next/server";
import {
  CustomerAuthError,
  requireCustomerId,
} from "@/lib/auth/requireCustomer";
import { getCustomerOrder } from "@/lib/orders/service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const customerId = await requireCustomerId();
    const { id } = await params;
    const order = await getCustomerOrder(customerId, id);
    return NextResponse.json(order);
  } catch (error) {
    if (error instanceof CustomerAuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
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
