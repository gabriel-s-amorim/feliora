import { NextResponse } from "next/server";
import {
  getAdminCustomer,
  updateAdminCustomer,
} from "@/lib/admin/customers";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { adminCustomerUpdateSchema } from "@/shared/schemas/customer";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;
    return NextResponse.json(await getAdminCustomer(id));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao carregar cliente";
    return NextResponse.json(
      { error: message },
      { status: message.includes("não encontrado") ? 404 : 500 }
    );
  }
}

export async function PUT(request: Request, { params }: Params) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const parsed = adminCustomerUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  try {
    const { id } = await params;
    return NextResponse.json(await updateAdminCustomer(id, parsed.data));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao salvar cliente";
    return NextResponse.json(
      { error: message },
      { status: message.includes("não encontrado") ? 404 : 500 }
    );
  }
}
