import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import {
  countAdminUnreadMessages,
  listAdminOrderMessages,
  sendAdminOrderMessage,
} from "@/lib/orders/communication";
import { sendOrderMessageSchema } from "@/shared/schemas/orderCommunication";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;
    // Conta antes de listar (listagem marca mensagens do cliente como lidas).
    const unreadCount = await countAdminUnreadMessages(id);
    const messages = await listAdminOrderMessages(id);
    return NextResponse.json({ messages, unreadCount });
  } catch (error) {
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
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

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

  try {
    const { id } = await params;
    const message = await sendAdminOrderMessage(id, parsed.data.body);
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao enviar mensagem";
    const status = message.includes("não encontrado")
      ? 404
      : message.includes("ainda não existem")
        ? 503
        : message.includes("sem cliente")
          ? 400
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
