import { NextResponse } from "next/server";
import {
  CustomerAuthError,
  requireCustomerId,
} from "@/lib/auth/requireCustomer";
import { createCheckoutShippingQuote } from "@/lib/melhorEnvio/service";
import { checkoutShippingQuoteSchema } from "@/shared/schemas/melhorEnvio";

export async function POST(request: Request) {
  try {
    const customerId = await requireCustomerId();
    const body = await request.json();
    const parsed = checkoutShippingQuoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "CEP inválido", issues: parsed.error.issues },
        { status: 400 }
      );
    }
    const result = await createCheckoutShippingQuote(
      customerId,
      parsed.data.toPostalCode
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CustomerAuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message =
      error instanceof Error ? error.message : "Erro ao calcular frete";
    const status = message.includes("Carrinho vazio") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
