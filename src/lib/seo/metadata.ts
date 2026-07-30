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

type BuildMetadataInput = {
  title?: string;
  description?: string;
  path?: string;
  image?: string | null;
  imageAlt?: string;
  type?: "website" | "article";
  noIndex?: boolean;
  keywords?: string[];
};

/**
 * Metadata completo para Google, Bing, WhatsApp, Instagram/Facebook e X.
 * Title sem template quando já inclui a marca; use `title` curto nas páginas filhas.
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

  return {
    title: {
      absolute: pageTitle,
    },
    description: pageDescription,
    ...(keywords?.length ? { keywords: keywords.join(", ") } : {}),
    alternates: {
      canonical: url,
      languages: {
        "pt-BR": url,
        "x-default": url,
      },
    },
    openGraph: {
      type,
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
