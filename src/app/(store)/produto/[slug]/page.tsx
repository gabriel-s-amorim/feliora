import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/store/ProductDetail";
import { getProductBySlug, listRelatedProducts } from "@/lib/products";
import { SITE_NAME, SITE_ORIGIN } from "@/shared/const/site";
import { formatPrice } from "@/lib/utils";

export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Produto" };

  const title = product.name;
  const description =
    product.shortDescription ||
    `${product.name} — ${formatPrice(product.price)} na ${SITE_NAME}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${SITE_ORIGIN}/produto/${product.slug}`,
      images: product.image ? [{ url: product.image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.image ? [product.image] : undefined,
    },
  };
}

function productJsonLd(
  product: NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>
) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription || product.description,
    image: [product.image, ...product.images].filter(Boolean),
    sku: product.variants?.[0]?.sku,
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: product.price.toFixed(2),
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${SITE_ORIGIN}/produto/${product.slug}`,
    },
    ...(product.reviewsCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.ratingAvg,
            reviewCount: product.reviewsCount,
          },
        }
      : {}),
  };
}

export default async function ProdutoPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await listRelatedProducts(product, 4);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd(product)),
        }}
      />
      <ProductDetail product={product} related={related} />
    </>
  );
}
