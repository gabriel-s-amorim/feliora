import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { mergeGuestCartIntoCustomer } from "@/lib/cart/service";
import { CART_SESSION_COOKIE } from "@/lib/cart/session";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const store = await cookies();
    const guestSessionId = store.get(CART_SESSION_COOKIE)?.value ?? null;

    const cart = await mergeGuestCartIntoCustomer(user.id, guestSessionId);

    // Invalida cookie guest — daqui em diante o carrinho é do customer
    if (guestSessionId) {
      store.set(CART_SESSION_COOKIE, "", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
    }

    return NextResponse.json({ cart });
  } catch (err) {
    console.error("[api/cart/merge]", err);
    return NextResponse.json(
      { error: "Falha ao unificar carrinho" },
      { status: 500 }
    );
  }
}
