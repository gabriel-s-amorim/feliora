import { NextResponse } from "next/server";
import { getPublicShippingConfig } from "@/lib/melhorEnvio/service";

export async function GET() {
  try {
    return NextResponse.json(await getPublicShippingConfig());
  } catch {
    return NextResponse.json({
      freeShippingEnabled: true,
      freeShippingThreshold: 299,
    });
  }
}
