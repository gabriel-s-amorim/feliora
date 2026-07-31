import { NextResponse } from "next/server";
import {
  deleteAdminReview,
  listAdminProductReviews,
  setAdminReviewApproved,
} from "@/lib/admin/reviews";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { adminReviewActionSchema } from "@/shared/schemas/review";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const statusRaw = searchParams.get("status") ?? "pending";
    const status =
      statusRaw === "approved" || statusRaw === "all" ? statusRaw : "pending";
    return NextResponse.json(await listAdminProductReviews(status));
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao listar avaliações",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const parsed = adminReviewActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "Dados inválidos",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    if (parsed.data.action === "approve") {
      const review = await setAdminReviewApproved(parsed.data.reviewId);
      return NextResponse.json(review);
    }

    await deleteAdminReview(parsed.data.reviewId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao atualizar avaliação",
      },
      { status: 500 }
    );
  }
}
