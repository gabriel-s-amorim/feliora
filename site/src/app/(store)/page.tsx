import Image from "next/image";
import Link from "next/link";
import {
  SITE_LOGO_PATH,
  SITE_NAME,
  SITE_TAGLINE,
} from "@/shared/const/site";
import { ProductCard } from "@/components/store/ProductCard";
import { listFeaturedProducts, listActiveProducts } from "@/lib/products";
import { listActiveCategoryNav } from "@/lib/categories";

export const revalidate = 60;

export default async function HomePage() {
  const [featured, latest, categories] = await Promise.all([
    listFeaturedProducts(8),
    listActiveProducts({ sort: "newest", limit: 8 }),
    listActiveCategoryNav(),
  ]);

  const showcase = featured.length > 0 ? featured : latest;

  return (
    <>
      <section className="relative isolate min-h-[calc(100dvh-3.5rem)] overflow-hidden sm:min-h-[calc(100dvh-4rem)]">
        <div className="absolute inset-0 bg-gradient-to-b from-ivory via-cream to-[#f3e8df]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          aria-hidden
        >
          <div className="absolute -left-24 top-16 size-[28rem] rounded-full border border-line" />
          <div className="absolute -right-16 bottom-10 size-[22rem] rounded-full border border-line/70" />
        </div>

        <div className="relative mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-6xl flex-col items-center justify-center px-4 py-16 text-center sm:min-h-[calc(100dvh-4rem)] sm:px-6 lg:px-8">
          <div className="animate-fade-up">
            <Image
              src={SITE_LOGO_PATH}
              alt={SITE_NAME}
              width={280}
              height={280}
              priority
              className="mx-auto h-36 w-auto object-contain sm:h-44 md:h-52"
            />
          </div>

          <p className="animate-fade-up animate-delay-1 mt-8 font-display text-[0.7rem] uppercase tracking-[0.42em] text-rose-gold sm:text-xs">
            {SITE_NAME}
          </p>

          <h1 className="animate-fade-up animate-delay-2 mt-4 max-w-xl font-display text-3xl font-light leading-tight tracking-[0.04em] text-ink sm:text-4xl md:text-5xl">
            {SITE_TAGLINE}
          </h1>

          <p className="animate-fade-up animate-delay-2 mt-4 max-w-md text-sm leading-relaxed text-ink-muted sm:text-base">
            Peças com acabamento cuidadoso — um ateliê digital com ritmo de
            lookbook.
          </p>

          <div className="animate-fade-up animate-delay-3 mt-10">
            <Link
              href="/catalogo"
              className="inline-flex min-h-12 items-center justify-center border border-rose-gold bg-rose-gold px-8 text-sm tracking-[0.16em] text-cream transition-colors duration-300 hover:border-rose-gold-light hover:bg-rose-gold-light"
            >
              Ver nova coleção
            </Link>
          </div>
        </div>
      </section>

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
    </>
  );
}
