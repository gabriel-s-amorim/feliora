import { NextResponse } from "next/server";
import { getAdminSiteAnalytics } from "@/lib/analytics/service";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { analyticsRangeSchema } from "@/shared/schemas/analytics";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const parsed = analyticsRangeSchema.safeParse(
    searchParams.get("range") ?? "today"
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Intervalo inválido" }, { status: 400 });
  }

  try {
    const data = await getAdminSiteAnalytics(parsed.data);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao carregar analytics",
      },
      { status: 500 }
    );
  }
}
