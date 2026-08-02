import type { MetadataRoute } from "next";
import { getCanonicalSiteOrigin } from "@/lib/seo/metadata";

export default function robots(): MetadataRoute.Robots {
  const origin = getCanonicalSiteOrigin();

  const disallowPrivate = [
    "/admin/",
    "/api/",
    "/busca",
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
        allow: ["/", "/feeds/"],
        disallow: disallowPrivate,
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/feeds/"],
        disallow: disallowPrivate,
      },
      {
        userAgent: "Googlebot-Image",
        allow: "/",
      },
      {
        userAgent: "bingbot",
        allow: ["/", "/feeds/"],
        disallow: disallowPrivate,
      },
      {
        userAgent: "BingPreview",
        allow: ["/", "/feeds/"],
        disallow: disallowPrivate,
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
