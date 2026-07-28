import { NextResponse } from "next/server";
import { createAdminBanner, listAdminBanners } from "@/lib/admin/banners";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { bannerSchema } from "@/shared/schemas/banner";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    return NextResponse.json(await listAdminBanners());
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao listar banners",
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
    const parsed = bannerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const banner = await createAdminBanner(parsed.data);
    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro ao criar banner",
      },
      { status: 500 }
    );
  }
}
