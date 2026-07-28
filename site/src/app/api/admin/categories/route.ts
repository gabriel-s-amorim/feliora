import { NextResponse } from "next/server";
import {
  createAdminCategory,
  listAdminCategories,
} from "@/lib/admin/categories";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { categoryCreateSchema } from "@/shared/schemas/category";
import { slugify } from "@/shared/lib/slugify";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    return NextResponse.json(await listAdminCategories());
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao listar categorias",
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
    const parsed = categoryCreateSchema.safeParse({
      ...body,
      slug: body.slug || slugify(body.name ?? ""),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const category = await createAdminCategory(parsed.data);
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao criar categoria",
      },
      { status: 500 }
    );
  }
}
