import { NextResponse } from "next/server";
import {
  applyCouponToCart,
  removeCouponFromCart,
} from "@/lib/cart/service";
import { resolveCartIdentityForWrite } from "@/lib/cart/identity";
import { CouponEvalError } from "@/lib/coupons/service";
import { cartCouponSchema } from "@/shared/schemas/cart";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const parsed = cartCouponSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Informe um código de cupom válido" },
        { status: 400 }
      );
    }

    const { identity } = await resolveCartIdentityForWrite();
    const result = await applyCouponToCart(identity, parsed.data.code);

    return NextResponse.json({
      cart: result.cart,
      couponApplication: result.couponApplication,
    });
  } catch (err) {
    if (err instanceof CouponEvalError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 400 }
      );
    }
    console.error("[api/cart/coupon PATCH]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Erro ao aplicar cupom",
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const { identity } = await resolveCartIdentityForWrite();
    const cart = await removeCouponFromCart(identity);
    return NextResponse.json({ cart, couponApplication: null });
  } catch (err) {
    console.error("[api/cart/coupon DELETE]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Erro ao remover cupom",
      },
      { status: 500 }
    );
  }
}
