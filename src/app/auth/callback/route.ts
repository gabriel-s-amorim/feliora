import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/conta";
  }
  return next;
}

function redirectTo(request: Request, path: string) {
  const { origin } = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  if (isLocalEnv) {
    return NextResponse.redirect(`${origin}${path}`);
  }
  if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${path}`);
  }
  return NextResponse.redirect(`${origin}${path}`);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return redirectTo(request, next);
    }
  }

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      return redirectTo(request, next);
    }
  }

  const failPath =
    type === "recovery"
      ? `/conta/recuperar-senha?error=${encodeURIComponent("Link inválido ou expirado. Solicite um novo.")}`
      : `/conta/entrar?error=${encodeURIComponent("Falha ao entrar com Google. Tente novamente.")}`;

  return NextResponse.redirect(`${origin}${failPath}`);
}
