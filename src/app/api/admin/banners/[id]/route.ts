import { NextResponse } from "next/server";
import {
  deleteAdminBanner,
  getAdminBanner,
  updateAdminBanner,
} from "@/lib/admin/banners";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { bannerSchema } from "@/shared/schemas/banner";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;

  try {
    const banner = await getAdminBanner(id);
    if (!banner) {
      return NextResponse.json(
        { error: "Banner não encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json(banner);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao carregar banner",
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
    const parsed = bannerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const banner = await updateAdminBanner(id, parsed.data);
    return NextResponse.json(banner);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao atualizar banner",
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
    const existing = await getAdminBanner(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Banner não encontrado" },
        { status: 404 }
      );
    }
    await deleteAdminBanner(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao excluir banner",
      },
      { status: 500 }
    );
  }
}
