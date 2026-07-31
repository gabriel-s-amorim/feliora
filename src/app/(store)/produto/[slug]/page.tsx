import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/store/ProductDetail";
import { ProductReviews } from "@/components/store/ProductReviews";
import { JsonLd } from "@/components/seo/JsonLd";
import { getProductBySlug, listRelatedProducts } from "@/lib/products";
import { listApprovedProductReviews } from "@/lib/reviews";
import { SITE_NAME } from "@/shared/const/site";
import { formatPrice } from "@/lib/utils";
import {
  productDescriptionText,
  sanitizeProductDescription,
} from "@/lib/productDescription";
import {
  buildPageMetadata,
  productKeywords,
  truncateMeta,
} from "@/lib/seo/metadata";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  productJsonLd,
} from "@/lib/seo/jsonld";

export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Produto", robots: { index: false } };

  const title = product.seoTitle || `${product.name} | ${SITE_NAME}`;
  const description = truncateMeta(
    product.seoDescription ||
      product.shortDescription ||
      productDescriptionText(product.description) ||
      `${product.name} — ${formatPrice(product.price)} na ${SITE_NAME}`
  );
  const sku =
    product.variants?.find((v) => v.isActive && v.stockCount > 0)?.sku ||
    product.variants?.find((v) => v.isActive)?.sku;

  return buildPageMetadata({
    title,
    description,
    path: `/produto/${product.slug}`,
    image: product.image || undefined,
    imageAlt: product.name,
    type: "product",
    keywords: productKeywords(product),
    product: {
      price: product.price,
      availability: product.inStock ? "instock" : "oos",
      brand: SITE_NAME,
      retailerItemId: sku,
    },
  });
}

export default async function ProdutoPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, reviews] = await Promise.all([
    listRelatedProducts(product, 4),
    listApprovedProductReviews(product.id),
  ]);

  const crumbs = [
    { name: "Início", path: "/" },
    { name: "Catálogo", path: "/catalogo" },
    ...(product.category
      ? [
          {
            name: product.category.name,
            path: `/categoria/${product.category.slug}`,
          },
        ]
      : []),
    { name: product.name, path: `/produto/${product.slug}` },
  ];

  return (
    <>
      <JsonLd
        data={[
          productJsonLd(product, reviews),
          breadcrumbJsonLd(crumbs),
          faqJsonLd(product.faq),
        ]}
      />
      <ProductDetail
        product={product}
        related={related}
        descriptionHtml={sanitizeProductDescription(product.description)}
        reviewsSlot={
          <ProductReviews
            productId={product.id}
            productSlug={product.slug}
            productName={product.name}
            ratingAvg={product.ratingAvg}
            reviewsCount={product.reviewsCount}
            reviews={reviews}
          />
        }
      />
    </>
  );
}
