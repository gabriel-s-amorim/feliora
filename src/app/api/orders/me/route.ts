import { NextResponse } from "next/server";
import {
  CustomerAuthError,
  requireCustomerId,
} from "@/lib/auth/requireCustomer";
import { listCustomerOrders } from "@/lib/orders/service";

export async function GET() {
  try {
    const customerId = await requireCustomerId();
    const orders = await listCustomerOrders(customerId);
    return NextResponse.json(orders);
  } catch (error) {
    if (error instanceof CustomerAuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Erro ao carregar pedidos" },
      { status: 500 }
    );
  }
}
