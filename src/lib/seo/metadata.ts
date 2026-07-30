import type { Metadata } from "next";
import {
  SITE_DESCRIPTION,
  SITE_LOCALE,
  SITE_NAME,
  SITE_OG_IMAGE_ALT,
  SITE_OG_IMAGE_HEIGHT,
  SITE_OG_IMAGE_PATH,
  SITE_OG_IMAGE_WIDTH,
  SITE_ORIGIN,
  SITE_TITLE,
} from "@/shared/const/site";

/** Origem canônica para sitemap, robots, JSON-LD e Open Graph. */
export function getCanonicalSiteOrigin(): string {
  return SITE_ORIGIN.replace(/\/$/, "");
}

export function absoluteUrl(path = "/"): string {
  const origin = getCanonicalSiteOrigin();
  if (!path || path === "/") return origin;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function truncateMeta(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const sliced = clean.slice(0, max - 1);
  const lastSpace = sliced.lastIndexOf(" ");
  return `${(lastSpace > 40 ? sliced.slice(0, lastSpace) : sliced).trim()}…`;
}

export type ProductOgData = {
  price: number;
  currency?: string;
  availability: "instock" | "oos";
  condition?: "new" | "used" | "refurbished";
  brand?: string;
  retailerItemId?: string;
};

type BuildMetadataInput = {
  title?: string;
  description?: string;
  path?: string;
  image?: string | null;
  imageAlt?: string;
  /** `product` vira og:type=product + tags product:* (Facebook/WhatsApp/Instagram). */
  type?: "website" | "article" | "product";
  noIndex?: boolean;
  keywords?: string[];
  product?: ProductOgData;
};

/**
 * Metadata completo para Google, Bing, WhatsApp, Instagram/Facebook e X.
 */
export function buildPageMetadata({
  title,
  description,
  path = "/",
  image,
  imageAlt,
  type = "website",
  noIndex = false,
  keywords,
  product,
}: BuildMetadataInput): Metadata {
  const pageTitle = title?.trim() || SITE_TITLE;
  const pageDescription = truncateMeta(
    description?.trim() || SITE_DESCRIPTION
  );
  const url = absoluteUrl(path);
  const ogImage = image?.trim() || SITE_OG_IMAGE_PATH;
  const alt = imageAlt?.trim() || SITE_OG_IMAGE_ALT;
  const isAbsoluteImage = /^https?:\/\//i.test(ogImage);
  const imageUrl = isAbsoluteImage ? ogImage : absoluteUrl(ogImage);

  const ogImages = [
    {
      url: ogImage,
      secureUrl: imageUrl,
      width: SITE_OG_IMAGE_WIDTH,
      height: SITE_OG_IMAGE_HEIGHT,
      alt,
      type: "image/png" as const,
    },
  ];

  const productOther =
    type === "product" && product
      ? {
          "og:type": "product",
          "product:brand": product.brand || SITE_NAME,
          "product:availability": product.availability,
          "product:condition": product.condition || "new",
          "product:price:amount": product.price.toFixed(2),
          "product:price:currency": product.currency || "BRL",
          ...(product.retailerItemId
            ? { "product:retailer_item_id": product.retailerItemId }
            : {}),
        }
      : type === "product"
        ? { "og:type": "product" }
        : undefined;

  return {
    title: {
      absolute: pageTitle,
    },
    description: pageDescription,
    ...(keywords ? { keywords: keywords.join(", ") } : {}),
    alternates: {
      canonical: url,
      languages: {
        "pt-BR": url,
        "x-default": url,
      },
    },
    openGraph: {
      // Next tipa só website|article; product vai em `other`/`og:type`.
      type: type === "article" ? "article" : "website",
      locale: SITE_LOCALE,
      url,
      siteName: SITE_NAME,
      title: pageTitle,
      description: pageDescription,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
      images: [ogImage],
    },
    ...(productOther ? { other: productOther } : {}),
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: { index: false, follow: false },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };
}

/** Keywords derivadas do produto — evita meta keywords genérica igual em toda a loja. */
export function productKeywords(product: {
  name: string;
  category?: { name: string } | null;
  materials?: string[];
  colors?: Array<{ name: string }>;
}): string[] {
  const base = [
    product.name,
    product.category?.name,
    SITE_NAME,
    "moda feminina",
    "comprar online",
  ];
  const extras = [
    ...(product.materials ?? []),
    ...(product.colors ?? []).map((c) => c.name),
  ];
  return [...new Set([...base, ...extras].filter(Boolean).map((s) => s!.trim()))].slice(
    0,
    12
  );
}
