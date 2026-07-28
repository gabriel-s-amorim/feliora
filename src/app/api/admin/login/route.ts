import { NextResponse } from "next/server";
import {
  authenticateAdmin,
  setAdminCookie,
  signAdminToken,
} from "@/lib/admin/auth";
import {
  checkAdminLoginRateLimit,
  clearAdminLoginFailures,
  getClientIp,
  recordAdminLoginFailure,
} from "@/lib/admin/rateLimit";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const email = body.email?.trim() ?? "";
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Informe e-mail e senha" },
        { status: 400 }
      );
    }

    const ip = getClientIp(request);
    const rateKey = `${ip}:${email.toLowerCase()}`;
    const rate = await checkAdminLoginRateLimit(rateKey);

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

    const session = await authenticateAdmin(email, password);

    if (!session) {
      await recordAdminLoginFailure(rateKey);
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    await clearAdminLoginFailures(rateKey);
    const token = await signAdminToken(session);
    await setAdminCookie(token);

    return NextResponse.json({
      admin: {
        id: session.adminId,
        email: session.email,
        name: session.name,
      },
    });
  } catch (error) {
    console.error("admin login error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao entrar" },
      { status: 500 }
    );
  }
}
