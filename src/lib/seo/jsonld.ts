import {
  SITE_DESCRIPTION,
  SITE_LEGAL_NAME,
  SITE_LOGO_PATH,
  SITE_NAME,
  SITE_ORIGIN,
} from "@/shared/const/site";
import { absoluteUrl } from "@/lib/seo/metadata";
import type { Product } from "@/shared/types/product";
import { productDescriptionText } from "@/lib/productDescription";

export type SocialLinks = {
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  twitterUrl?: string;
  contactEmail?: string;
  whatsappNumber?: string;
  addressLine?: string;
};

function sameAs(links: SocialLinks): string[] {
  return [
    links.instagramUrl,
    links.facebookUrl,
    links.tiktokUrl,
    links.twitterUrl,
  ].filter((u): u is string => Boolean(u?.trim()));
}

export function organizationJsonLd(links: SocialLinks = {}) {
  const social = sameAs(links);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_ORIGIN}/#organization`,
    name: SITE_LEGAL_NAME,
    legalName: SITE_LEGAL_NAME,
    url: SITE_ORIGIN,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(SITE_LOGO_PATH),
    },
    description: SITE_DESCRIPTION,
    ...(links.contactEmail
      ? {
          email: links.contactEmail,
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer service",
            email: links.contactEmail,
            availableLanguage: ["Portuguese"],
            ...(links.whatsappNumber
              ? { telephone: `+${links.whatsappNumber.replace(/\D/g, "")}` }
              : {}),
          },
        }
      : {}),
    ...(links.addressLine
      ? {
          address: {
            "@type": "PostalAddress",
            addressCountry: "BR",
            streetAddress: links.addressLine,
          },
        }
      : {}),
    ...(social.length ? { sameAs: social } : {}),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_ORIGIN}/#website`,
    name: SITE_NAME,
    url: SITE_ORIGIN,
    description: SITE_DESCRIPTION,
    inLanguage: "pt-BR",
    publisher: { "@id": `${SITE_ORIGIN}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_ORIGIN}/busca?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function productJsonLd(product: Product) {
  const description =
    product.seoDescription ||
    product.shortDescription ||
    productDescriptionText(product.description) ||
    `${product.name} na ${SITE_NAME}`;

  const images = [product.image, ...product.images]
    .filter(Boolean)
    .map((src) => (src.startsWith("http") ? src : absoluteUrl(src)));

  const url = absoluteUrl(`/produto/${product.slug}`);
  const sku =
    product.variants?.find((v) => v.isActive)?.sku ||
    product.variants?.[0]?.sku;

  const offers = {
    "@type": "Offer" as const,
    url,
    priceCurrency: "BRL",
    price: product.price.toFixed(2),
    priceValidUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60)
      .toISOString()
      .slice(0, 10),
    availability: product.inStock
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock",
    itemCondition: "https://schema.org/NewCondition",
    seller: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_ORIGIN,
    },
  };

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    description,
    image: images.length ? images : undefined,
    sku,
    mpn: sku,
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    category: product.category?.name,
    url,
    offers,
    ...(product.reviewsCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(product.ratingAvg).toFixed(1),
            reviewCount: product.reviewsCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
}

export function faqJsonLd(
  faqs: Array<{ question: string; answer: string }>
) {
  if (!faqs.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}
