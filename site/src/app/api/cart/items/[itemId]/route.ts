import { NextResponse } from "next/server";
import {
  emptyCart,
  removeCartItem,
  updateCartItemQuantity,
} from "@/lib/cart/service";
import { resolveCartIdentity } from "@/lib/cart/identity";
import { cartUpdateSchema } from "@/shared/schemas/cart";

type Params = { params: Promise<{ itemId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { itemId } = await params;
    const { identity } = await resolveCartIdentity();
    if (!identity) {
      return NextResponse.json({ error: "Carrinho vazio" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = cartUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const cart = await updateCartItemQuantity(
      identity,
      itemId,
      parsed.data.quantity
    );
    return NextResponse.json({ cart });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao atualizar item";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { itemId } = await params;
    const { identity } = await resolveCartIdentity();
    if (!identity) {
      return NextResponse.json({ cart: emptyCart() });
    }
    const cart = await removeCartItem(identity, itemId);
    return NextResponse.json({ cart });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao remover item";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
