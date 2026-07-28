import { NextResponse } from "next/server";
import {
  adminProductSlugExists,
  createAdminProduct,
  listAdminProducts,
} from "@/lib/admin/products";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { productCreateSchema } from "@/shared/schemas/product";
import { slugify } from "@/shared/lib/slugify";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const products = await listAdminProducts();
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao listar produtos",
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
    const parsed = productCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    let input = parsed.data;
    if (!input.slug) {
      input = { ...input, slug: slugify(input.name) };
    }

    if (await adminProductSlugExists(input.slug)) {
      let candidate = input.slug;
      let n = 2;
      while (await adminProductSlugExists(candidate)) {
        candidate = `${input.slug}-${n}`;
        n += 1;
      }
      input = { ...input, slug: candidate };
    }

    const product = await createAdminProduct(input);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro ao criar produto",
      },
      { status: 500 }
    );
  }
}
