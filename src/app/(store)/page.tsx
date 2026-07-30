import Link from "next/link";
import { SITE_NAME } from "@/shared/const/site";
import { ProductGrid } from "@/components/store/ProductGrid";
import { HomeHero } from "@/components/store/HomeHero";
import { GradientBlobBackground } from "@/components/store/GradientBlobBackground";
import { JsonLd } from "@/components/seo/JsonLd";
import { listActiveBanners } from "@/lib/banners";
import { listFeaturedProducts, listActiveProducts } from "@/lib/products";
import { listActiveCategoryNav } from "@/lib/categories";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbJsonLd,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo/jsonld";
import { getPublicStoreSettings } from "@/lib/storeSettings";

export const revalidate = 60;

export const metadata = buildPageMetadata({
  path: "/",
});

export default async function HomePage() {
  const [featured, latest, categories, banners, settings] = await Promise.all([
    listFeaturedProducts(8),
    listActiveProducts({ sort: "newest", limit: 8 }),
    listActiveCategoryNav(),
    listActiveBanners(),
    getPublicStoreSettings(),
  ]);

  const showcase = featured.length > 0 ? featured : latest;

  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd({
            contactEmail: settings.contactEmail,
            whatsappNumber: settings.whatsappNumber,
            addressLine: settings.addressLine,
            instagramUrl: settings.instagramUrl,
            facebookUrl: settings.facebookUrl,
            tiktokUrl: settings.tiktokUrl,
            twitterUrl: settings.twitterUrl,
          }),
          websiteJsonLd(),
          breadcrumbJsonLd([{ name: "Início", path: "/" }]),
        ]}
      />
      <HomeHero banners={banners} />

      {categories.length > 0 ? (
        <section className="border-t border-line/60">
          <div className="mx-auto max-w-4xl px-4 py-10 text-center sm:px-6 sm:py-12 lg:px-8 lg:py-14">
            <p className="font-display text-[0.65rem] uppercase tracking-[0.42em] text-rose-gold">
              Explorar
            </p>
            <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-4 sm:mt-7 sm:gap-x-10">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={c.href}
                    className="font-display text-sm tracking-[0.14em] text-ink transition-colors hover:text-rose-gold sm:text-base"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {showcase.length > 0 ? (
        <section className="relative overflow-hidden">
          <GradientBlobBackground variant="featured" />
          <div className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div className="mb-12 text-center sm:mb-14">
              <p className="font-display text-[0.65rem] uppercase tracking-[0.42em] text-rose-gold">
                Lookbook
              </p>
              <h2 className="mt-4 font-display text-3xl font-light tracking-[0.08em] text-ink sm:text-4xl">
                {featured.length > 0 ? "Em destaque" : "Novidades"}
              </h2>
            </div>
            <ProductGrid products={showcase} priorityCount={2} />
            <div className="mt-14 text-center">
              <Link
                href="/catalogo"
                className="inline-flex min-h-11 items-center border border-ink px-8 text-[11px] tracking-[0.22em] text-ink transition-colors hover:border-rose-gold hover:text-rose-gold"
              >
                Ver tudo
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {!showcase.length && !categories.length ? (
        <p className="sr-only">{SITE_NAME}</p>
      ) : null}
    </>
  );
}
