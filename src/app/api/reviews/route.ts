import { NextResponse } from "next/server";
import {
  CustomerAuthError,
  requireCustomerId,
} from "@/lib/auth/requireCustomer";
import { createProductReview } from "@/lib/reviews";
import { createProductReviewSchema } from "@/shared/schemas/review";

export async function POST(request: Request) {
  try {
    const customerId = await requireCustomerId();
    const body = await request.json();
    const parsed = createProductReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "Dados inválidos",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const review = await createProductReview(customerId, parsed.data);
    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    if (error instanceof CustomerAuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message =
      error instanceof Error ? error.message : "Erro ao enviar avaliação";
    const status =
      message.includes("já avaliou") ||
      message.includes("aguardando aprovação") ||
      message.includes("pedidos já entregues") ||
      message.includes("Não é possível")
        ? 403
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
