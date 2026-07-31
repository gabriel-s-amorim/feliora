import Link from "next/link";
import { LookbookProductTile } from "@/components/store/LookbookProductTile";
import type { Product } from "@/shared/types/product";
import { cn } from "@/lib/utils";

type Props = {
  products: Product[];
  title: string;
};

export function HomeLookbook({ products, title }: Props) {
  if (products.length === 0) return null;

  const mid = Math.min(5, products.length);
  const first = products.slice(0, mid);
  const second = products.slice(mid);

  return (
    <section aria-labelledby="home-lookbook-heading" className="relative">
      <div className="mx-auto max-w-[90rem] px-3 pt-10 sm:px-5 sm:pt-14 lg:px-8 lg:pt-16">
        <header className="mb-8 text-center sm:mb-10 md:mb-12">
          <p className="font-display text-[0.65rem] uppercase tracking-[0.42em] text-rose-gold">
            Lookbook
          </p>
          <h2
            id="home-lookbook-heading"
            className="mt-3 font-display text-3xl font-light tracking-[0.08em] text-ink sm:text-4xl"
          >
            {title}
          </h2>
        </header>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 lg:gap-5">
          {first.map((product, i) => {
            const featured = i === 0;
            return (
              <LookbookProductTile
                key={product.id}
                product={product}
                priority={i < 2}
                className={cn(
                  "aspect-[3/4]",
                  featured &&
                    "md:col-span-2 md:row-span-2 md:aspect-auto md:h-full md:min-h-0"
                )}
                sizes={
                  featured
                    ? "(max-width: 768px) 50vw, 50vw"
                    : "(max-width: 768px) 50vw, 25vw"
                }
              />
            );
          })}
        </div>

        {second.length > 0 ? (
          <>
            <p className="mx-auto max-w-md py-12 text-center font-display text-xl font-light leading-snug tracking-[0.04em] text-ink-muted sm:py-14 sm:text-2xl">
              Peças com presença — silhueta que permanece.
            </p>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 lg:gap-5">
              {second.map((product, i) => (
                <LookbookProductTile
                  key={product.id}
                  product={product}
                  className={cn(
                    "aspect-[3/4]",
                    i === 0 && second.length >= 3 && "md:col-span-2"
                  )}
                  sizes={
                    i === 0 && second.length >= 3
                      ? "(max-width: 768px) 50vw, 50vw"
                      : "(max-width: 768px) 50vw, 25vw"
                  }
                />
              ))}
            </div>
          </>
        ) : null}

        <div className="flex justify-center py-14 sm:py-16">
          <Link
            href="/catalogo"
            className="inline-flex min-h-11 items-center border border-ink px-8 text-[11px] tracking-[0.22em] text-ink transition-colors hover:border-rose-gold hover:text-rose-gold"
          >
            Ver tudo
          </Link>
        </div>
      </div>
    </section>
  );
}
