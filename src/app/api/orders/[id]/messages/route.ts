import { NextResponse } from "next/server";
import {
  CustomerAuthError,
  requireCustomerId,
} from "@/lib/auth/requireCustomer";
import {
  listCustomerOrderMessages,
  sendCustomerOrderMessage,
} from "@/lib/orders/communication";
import { sendOrderMessageSchema } from "@/shared/schemas/orderCommunication";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const customerId = await requireCustomerId();
    const { id } = await params;
    const messages = await listCustomerOrderMessages(customerId, id);
    return NextResponse.json({ messages });
  } catch (error) {
    if (error instanceof CustomerAuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message =
      error instanceof Error ? error.message : "Erro ao carregar mensagens";
    const status =
      message.includes("não encontrado") || message.includes("0 rows")
        ? 404
        : 500;
    return NextResponse.json(
      { error: status === 404 ? "Pedido não encontrado" : message },
      { status }
    );
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const customerId = await requireCustomerId();
    const { id } = await params;
    const body = await request.json();
    const parsed = sendOrderMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "Dados inválidos",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const message = await sendCustomerOrderMessage(
      customerId,
      id,
      parsed.data.body
    );
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    if (error instanceof CustomerAuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message =
      error instanceof Error ? error.message : "Erro ao enviar mensagem";
    const status = message.includes("não encontrado")
      ? 404
      : message.includes("ainda não existem")
        ? 503
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
