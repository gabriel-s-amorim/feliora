import { SITE_NAME } from "@/shared/const/site";
import { HomeHero } from "@/components/store/HomeHero";
import { HomeExploreNav } from "@/components/store/HomeExploreNav";
import { HomeLookbook } from "@/components/store/HomeLookbook";
import { HomeBrandStory } from "@/components/store/HomeBrandStory";
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
import { brandStoryPublicUrl } from "@/shared/const/brandStory";

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
  const lookbookTitle = featured.length > 0 ? "Em destaque" : "Novidades";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const brandStoryUrl = supabaseUrl
    ? brandStoryPublicUrl(supabaseUrl)
    : null;

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
        <HomeExploreNav categories={categories} />
      ) : null}

      {showcase.length > 0 ? (
        <HomeLookbook products={showcase} title={lookbookTitle} />
      ) : null}

      {brandStoryUrl ? <HomeBrandStory videoUrl={brandStoryUrl} /> : null}

      {!showcase.length && !categories.length ? (
        <p className="sr-only">{SITE_NAME}</p>
      ) : null}
    </>
  );
}
