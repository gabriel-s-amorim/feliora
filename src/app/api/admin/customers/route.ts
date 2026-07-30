import { NextResponse } from "next/server";
import { listAdminCustomers } from "@/lib/admin/customers";
import { requireAdmin } from "@/lib/admin/requireAdmin";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    return NextResponse.json(await listAdminCustomers());
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao listar clientes",
      },
      { status: 500 }
    );
  }
}
