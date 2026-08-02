import { NextResponse } from "next/server";
import {
  buildGoogleMerchantTsv,
} from "@/lib/merchant/googleFeed";
import { getPublicShippingConfig } from "@/lib/melhorEnvio/service";
import { listAllActiveProductsForFeed } from "@/lib/products";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isAuthorized(request: Request): boolean {
  const token = process.env.GOOGLE_MERCHANT_FEED_TOKEN?.trim();
  if (!token) return true;

  const url = new URL(request.url);
  const queryToken = url.searchParams.get("token");
  if (queryToken && queryToken === token) return true;

  const header = request.headers.get("authorization");
  if (header === `Bearer ${token}`) return true;

  return false;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const [products, shipping] = await Promise.all([
      listAllActiveProductsForFeed(),
      getPublicShippingConfig().catch(() => ({
        freeShippingEnabled: true,
        freeShippingThreshold: 299,
      })),
    ]);

    const defaultShippingPrice = Number(
      process.env.GOOGLE_MERCHANT_DEFAULT_SHIPPING ?? "19.90"
    );

    const body = buildGoogleMerchantTsv(products, {
      freeShippingEnabled: shipping.freeShippingEnabled,
      freeShippingThreshold: shipping.freeShippingThreshold,
      defaultShippingPrice: Number.isFinite(defaultShippingPrice)
        ? defaultShippingPrice
        : 19.9,
    });

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/tab-separated-values; charset=utf-8",
        "Content-Disposition":
          'inline; filename="feliora-google-merchant.txt"',
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("[feeds/google-merchant]", error);
    return new NextResponse("Failed to build product feed", { status: 500 });
  }
}
