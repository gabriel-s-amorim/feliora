import { NextResponse } from "next/server";
import { getCustomerIdOrNull } from "@/lib/auth/requireCustomer";
import { getReviewEligibility } from "@/lib/reviews";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productIdRaw = searchParams.get("productId");
    const productSlug = searchParams.get("slug")?.trim() ?? "";
    const productId = productIdRaw ? Number(productIdRaw) : NaN;

    if (!Number.isFinite(productId) || productId <= 0 || !productSlug) {
      return NextResponse.json(
        { error: "Informe productId e slug válidos" },
        { status: 400 }
      );
    }

    const customerId = await getCustomerIdOrNull();
    const eligibility = await getReviewEligibility(
      customerId,
      productId,
      productSlug
    );

    return NextResponse.json(eligibility);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao verificar elegibilidade",
      },
      { status: 500 }
    );
  }
}
