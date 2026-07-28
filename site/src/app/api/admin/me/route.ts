import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  return NextResponse.json({
    admin: {
      id: auth.session.adminId,
      email: auth.session.email,
      name: auth.session.name,
    },
  });
}
