import { NextResponse } from "next/server";
import {
  createAdminCoupon,
  listAdminCoupons,
} from "@/lib/admin/coupons";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { couponCreateSchema } from "@/shared/schemas/coupon";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("q") ?? undefined;
    return NextResponse.json(await listAdminCoupons(search));
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao listar cupons",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const parsed = couponCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const coupon = await createAdminCoupon(parsed.data);
    return NextResponse.json(coupon, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao criar cupom";
    const status = message.toLowerCase().includes("duplicate") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
