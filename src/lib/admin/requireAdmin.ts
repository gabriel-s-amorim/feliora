import { NextResponse } from "next/server";
import {
  getAdminSessionFromCookies,
  type AdminSession,
} from "@/lib/admin/auth";

export async function requireAdmin(): Promise<
  { session: AdminSession } | { error: NextResponse }
> {
  const session = await getAdminSessionFromCookies();
  if (!session) {
    return {
      error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
    };
  }
  return { session };
}
