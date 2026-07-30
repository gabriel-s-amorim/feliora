import { NextResponse } from "next/server";
import {
  emptyCart,
  getActiveCart,
  addVariantToCart,
  resolveCouponApplicationForCart,
} from "@/lib/cart/service";
import {
  resolveCartIdentity,
  resolveCartIdentityForWrite,
} from "@/lib/cart/identity";
import { cartAddSchema } from "@/shared/schemas/cart";

export async function GET() {
  try {
    const { identity } = await resolveCartIdentity();
    if (!identity) {
      return NextResponse.json({
        cart: emptyCart(),
        couponApplication: null,
      });
    }
    const cart = (await getActiveCart(identity)) ?? emptyCart();
    const resolved = await resolveCouponApplicationForCart(cart);
    return NextResponse.json({
      cart: resolved.cart,
      couponApplication: resolved.couponApplication,
    });
  } catch (err) {
    console.error("[api/cart GET]", err);
    return NextResponse.json(
      { error: "Não foi possível carregar o carrinho" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = cartAddSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { identity } = await resolveCartIdentityForWrite();
    const cart = await addVariantToCart(
      identity,
      parsed.data.variantId,
      parsed.data.quantity
    );
    const resolved = await resolveCouponApplicationForCart(cart);

    return NextResponse.json({
      cart: resolved.cart,
      couponApplication: resolved.couponApplication,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao adicionar ao carrinho";
    const status =
      message.includes("Estoque") ||
      message.includes("indisponível") ||
      message.includes("não encontrada")
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
