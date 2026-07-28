import { NextResponse } from "next/server";
import {
  CustomerAuthError,
  requireCustomerId,
} from "@/lib/auth/requireCustomer";
import { createOrderFromCheckout } from "@/lib/orders/service";
import { checkoutSchema } from "@/shared/schemas/order";

export async function POST(request: Request) {
  try {
    const customerId = await requireCustomerId();
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const result = await createOrderFromCheckout(customerId, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CustomerAuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message =
      error instanceof Error ? error.message : "Erro ao finalizar compra";
    const status =
      message.includes("Carrinho vazio") ||
      message.includes("inválido") ||
      message.includes("insuficiente") ||
      message.includes("expirou") ||
      message.includes("mudou")
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
