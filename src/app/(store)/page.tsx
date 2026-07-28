import Link from "next/link";
import { SITE_NAME } from "@/shared/const/site";
import { ProductCard } from "@/components/store/ProductCard";
import { HomeHero } from "@/components/store/HomeHero";
import { listActiveBanners } from "@/lib/banners";
import { listFeaturedProducts, listActiveProducts } from "@/lib/products";
import { listActiveCategoryNav } from "@/lib/categories";

export const revalidate = 60;

export default async function HomePage() {
  const [featured, latest, categories, banners] = await Promise.all([
    listFeaturedProducts(8),
    listActiveProducts({ sort: "newest", limit: 8 }),
    listActiveCategoryNav(),
    listActiveBanners(),
  ]);

  const showcase = featured.length > 0 ? featured : latest;

  return (
    <>
      <HomeHero banners={banners} />

      {categories.length > 0 ? (
        <section className="border-t border-line bg-ivory/50">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="text-center font-display text-2xl font-light tracking-[0.08em] text-ink">
              Categorias
            </h2>
            <ul className="mt-8 flex flex-wrap justify-center gap-3">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={c.href}
                    className="inline-flex min-h-11 items-center border border-line px-5 text-xs tracking-[0.16em] text-ink transition-colors hover:border-rose-gold hover:text-rose-gold"
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
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="font-display text-xs uppercase tracking-[0.3em] text-rose-gold">
                Lookbook
              </p>
              <h2 className="mt-2 font-display text-2xl font-light tracking-[0.06em] text-ink sm:text-3xl">
                {featured.length > 0 ? "Em destaque" : "Novidades"}
              </h2>
            </div>
            <Link
              href="/catalogo"
              className="hidden text-xs tracking-[0.14em] text-rose-gold transition-colors hover:text-rose-gold-light sm:inline"
            >
              Ver tudo
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
            {showcase.map((product, i) => (
              <ProductCard key={product.id} product={product} priority={i < 2} />
            ))}
          </div>
          <div className="mt-10 text-center sm:hidden">
            <Link
              href="/catalogo"
              className="inline-flex min-h-11 items-center text-xs tracking-[0.14em] text-rose-gold"
            >
              Ver catálogo completo
            </Link>
          </div>
        </section>
      ) : null}

      {!showcase.length && !categories.length ? (
        <p className="sr-only">{SITE_NAME}</p>
      ) : null}
    </>
  );
}
