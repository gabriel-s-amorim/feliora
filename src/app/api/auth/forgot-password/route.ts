import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientIp } from "@/lib/admin/rateLimit";
import { requestPasswordReset } from "@/lib/auth/passwordReset";
import { forgotPasswordSchema } from "@/shared/schemas/auth";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

async function allowForgotPassword(ip: string, email: string): Promise<{
  allowed: boolean;
  retryAfterSec?: number;
}> {
  try {
    const supabase = createAdminClient();
    const bucket = `forgot-password:${ip}:${email}`;
    const since = new Date(Date.now() - WINDOW_MS).toISOString();
    const { count, error } = await supabase
      .from("rate_limit_events")
      .select("id", { count: "exact", head: true })
      .eq("bucket", bucket)
      .gte("created_at", since);

    if (error) {
      console.error("forgot-password rate check failed:", error.message);
      return { allowed: true };
    }

    if ((count ?? 0) >= MAX_ATTEMPTS) {
      return {
        allowed: false,
        retryAfterSec: Math.ceil(WINDOW_MS / 1000),
      };
    }

    await supabase.from("rate_limit_events").insert({ bucket });
    return { allowed: true };
  } catch (err) {
    console.error("forgot-password rate check exception:", err);
    return { allowed: true };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Informe um e-mail válido" },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase();
    const ip = getClientIp(request);
    const rate = await allowForgotPassword(ip, email);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Muitas tentativas. Tente novamente mais tarde." },
        {
          status: 429,
          headers: rate.retryAfterSec
            ? { "Retry-After": String(rate.retryAfterSec) }
            : undefined,
        }
      );
    }

    const result = await requestPasswordReset(email);
    return NextResponse.json(result);
  } catch (error) {
    console.error("forgot-password error:", error);
    return NextResponse.json(
      { error: "Não foi possível enviar o e-mail. Tente novamente mais tarde." },
      { status: 500 }
    );
  }
}
