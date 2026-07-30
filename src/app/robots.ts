import type { MetadataRoute } from "next";
import { getCanonicalSiteOrigin } from "@/lib/seo/metadata";

export default function robots(): MetadataRoute.Robots {
  const origin = getCanonicalSiteOrigin();

  const disallowPrivate = [
    "/admin/",
    "/api/",
    "/carrinho",
    "/checkout",
    "/conta",
    "/favoritos",
    "/notificacoes",
    "/auth/",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: disallowPrivate,
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: disallowPrivate,
      },
      {
        userAgent: "Googlebot-Image",
        allow: "/",
      },
      {
        userAgent: "bingbot",
        allow: "/",
        disallow: disallowPrivate,
      },
      {
        userAgent: "BingPreview",
        allow: "/",
        disallow: disallowPrivate,
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
