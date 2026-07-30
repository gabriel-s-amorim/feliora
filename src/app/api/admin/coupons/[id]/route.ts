import { NextResponse } from "next/server";
import {
  deleteAdminCoupon,
  getAdminCoupon,
  updateAdminCoupon,
} from "@/lib/admin/coupons";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { couponUpdateSchema } from "@/shared/schemas/coupon";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;

  try {
    const coupon = await getAdminCoupon(id);
    if (!coupon) {
      return NextResponse.json(
        { error: "Cupom não encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json(coupon);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao carregar cupom",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: Params) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = couponUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const existing = await getAdminCoupon(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Cupom não encontrado" },
        { status: 404 }
      );
    }

    const coupon = await updateAdminCoupon(id, parsed.data);
    return NextResponse.json(coupon);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao atualizar cupom";
    const status = message.toLowerCase().includes("duplicate") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = couponUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const existing = await getAdminCoupon(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Cupom não encontrado" },
        { status: 404 }
      );
    }

    const coupon = await updateAdminCoupon(id, parsed.data);
    return NextResponse.json(coupon);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao atualizar cupom",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;

  try {
    const existing = await getAdminCoupon(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Cupom não encontrado" },
        { status: 404 }
      );
    }
    await deleteAdminCoupon(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao excluir cupom",
      },
      { status: 500 }
    );
  }
}
