import { NextResponse } from "next/server";
import { getMercadoPagoPublicConfig } from "@/lib/mercadoPago/service";

export async function GET() {
  try {
    const config = await getMercadoPagoPublicConfig();
    return NextResponse.json(config);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Pagamento indisponível";
    return NextResponse.json(
      { enabled: false, publicKey: "", methods: [], maxInstallments: 1, error: message },
      { status: 503 }
    );
  }
}
