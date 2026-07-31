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
        <section aria-label="Explorar categorias">
          <div className="mx-auto max-w-5xl px-4 py-14 text-center sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <p className="font-display text-[0.7rem] uppercase tracking-[0.42em] text-rose-gold">
              Explorar
            </p>
            <div
              className="mx-auto mt-4 h-px w-10 bg-rose-gold/45"
              aria-hidden
            />
            <nav className="mt-9 sm:mt-11" aria-label="Categorias">
              <ul className="flex flex-col items-center gap-6 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-0">
                {categories.map((c, i) => (
                  <li key={c.id} className="flex items-center">
                    {i > 0 ? (
                      <span
                        className="mx-5 hidden h-7 w-px shrink-0 bg-line sm:mx-7 sm:block md:mx-9 md:h-8"
                        aria-hidden
                      />
                    ) : null}
                    <Link
                      href={c.href}
                      className="group relative inline-block font-display text-[1.65rem] font-light leading-none tracking-[0.06em] text-ink transition-colors duration-300 hover:text-rose-gold sm:text-[1.85rem] md:text-[2.15rem] lg:text-[2.35rem]"
                    >
                      {c.name}
                      <span
                        className="absolute -bottom-2 left-1/2 h-px w-0 -translate-x-1/2 bg-rose-gold transition-[width] duration-300 ease-out group-hover:w-full group-focus-visible:w-full"
                        aria-hidden
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
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
