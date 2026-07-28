import { NextResponse } from "next/server";
import { reorderAdminBanners } from "@/lib/admin/banners";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { bannerReorderSchema } from "@/shared/schemas/banner";

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const parsed = bannerReorderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const banners = await reorderAdminBanners(parsed.data.orderedIds);
    return NextResponse.json(banners);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao reordenar banners",
      },
      { status: 500 }
    );
  }
}
