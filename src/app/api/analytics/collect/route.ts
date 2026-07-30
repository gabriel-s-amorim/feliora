import { NextResponse } from "next/server";
import { recordSiteAnalyticsEvent } from "@/lib/analytics/service";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientIp } from "@/lib/admin/rateLimit";
import { analyticsCollectSchema } from "@/shared/schemas/analytics";

const WINDOW_MS = 60_000;
const MAX_EVENTS = 40;

async function allowCollect(ip: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const bucket = `analytics-collect:${ip}`;
    const since = new Date(Date.now() - WINDOW_MS).toISOString();
    const { count } = await supabase
      .from("rate_limit_events")
      .select("id", { count: "exact", head: true })
      .eq("bucket", bucket)
      .gte("created_at", since);

    if ((count ?? 0) >= MAX_EVENTS) return false;

    await supabase.from("rate_limit_events").insert({ bucket });
    return true;
  } catch {
    return true;
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!(await allowCollect(ip))) {
    return NextResponse.json({ error: "Muitas requisições" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = analyticsCollectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const pathOnly = parsed.data.path.split("?")[0] || "/";

  // Não registra rotas do admin / APIs
  if (pathOnly.startsWith("/admin") || pathOnly.startsWith("/api")) {
    return NextResponse.json({ ok: true });
  }

  try {
    await recordSiteAnalyticsEvent({
      ...parsed.data,
      path: pathOnly,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("analytics collect failed:", error);
    return NextResponse.json({ error: "Falha ao registrar" }, { status: 500 });
  }
}
