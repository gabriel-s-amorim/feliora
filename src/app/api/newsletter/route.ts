import { NextResponse } from "next/server";
import { newsletterSubscribeSchema } from "@/shared/schemas/brevo";
import { subscribeNewsletter } from "@/lib/brevo/newsletter";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = newsletterSubscribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos. Confirme o e-mail e o consentimento." },
        { status: 400 }
      );
    }

    const forwarded = request.headers.get("x-forwarded-for");
    const ip =
      forwarded?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;
    const userAgent = request.headers.get("user-agent");

    const result = await subscribeNewsletter(parsed.data, { ip, userAgent });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Newsletter error:", error);
    return NextResponse.json(
      { error: "Não foi possível concluir a inscrição" },
      { status: 500 }
    );
  }
}
