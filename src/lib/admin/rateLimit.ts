import { createAdminClient } from "@/lib/supabase/admin";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function failureBucket(key: string): string {
  return `admin-login:${key}`;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

export async function checkAdminLoginRateLimit(key: string): Promise<{
  allowed: boolean;
  retryAfterSec?: number;
}> {
  try {
    const supabase = createAdminClient();
    const since = new Date(Date.now() - WINDOW_MS).toISOString();
    const { count, error } = await supabase
      .from("rate_limit_events")
      .select("id", { count: "exact", head: true })
      .eq("bucket", failureBucket(key))
      .gte("created_at", since);

    if (error) {
      console.error("admin login rate check failed:", error.message);
      return { allowed: true };
    }

    if ((count ?? 0) >= MAX_ATTEMPTS) {
      return {
        allowed: false,
        retryAfterSec: Math.ceil(WINDOW_MS / 1000),
      };
    }

    return { allowed: true };
  } catch (err) {
    console.error("admin login rate check exception:", err);
    return { allowed: true };
  }
}

export async function recordAdminLoginFailure(key: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("rate_limit_events").insert({
      bucket: failureBucket(key),
    });
    if (error) {
      console.error("admin login failure record failed:", error.message);
    }
  } catch (err) {
    console.error("admin login failure record exception:", err);
  }
}

export async function clearAdminLoginFailures(key: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    const since = new Date(Date.now() - WINDOW_MS).toISOString();
    const { error } = await supabase
      .from("rate_limit_events")
      .delete()
      .eq("bucket", failureBucket(key))
      .gte("created_at", since);
    if (error) {
      console.error("admin login clear failed:", error.message);
    }
  } catch (err) {
    console.error("admin login clear exception:", err);
  }
}
