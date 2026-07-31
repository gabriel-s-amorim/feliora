import Link from "next/link";
import { LookbookProductTile } from "@/components/store/LookbookProductTile";
import type { Product } from "@/shared/types/product";
import { cn } from "@/lib/utils";

type Props = {
  products: Product[];
  title: string;
};

type Phrase = {
  eyebrow: string;
  line: string;
  align?: "center" | "start";
  tone?: "cream" | "ink" | "blush";
};

function PhraseCell({
  phrase,
  className,
}: {
  phrase: Phrase;
  className?: string;
}) {
  const tone =
    phrase.tone === "ink"
      ? "bg-ink text-cream"
      : phrase.tone === "blush"
        ? "bg-[#f3e6df] text-ink"
        : "bg-ivory text-ink";

  const align =
    phrase.align === "start" ? "items-start text-left" : "items-center text-center";

  return (
    <div
      className={cn(
        "flex flex-col justify-center gap-3 px-6 py-8 sm:px-8 md:px-10",
        tone,
        align,
        className
      )}
    >
      <p
        className={cn(
          "font-display text-[0.65rem] uppercase tracking-[0.4em]",
          phrase.tone === "ink" ? "text-rose-gold-light" : "text-rose-gold"
        )}
      >
        {phrase.eyebrow}
      </p>
      <p
        className={cn(
          "max-w-[17rem] font-display text-2xl font-light leading-snug tracking-[0.04em] sm:text-[1.85rem]",
          phrase.align !== "start" && "mx-auto"
        )}
      >
        {phrase.line}
      </p>
    </div>
  );
}

export function HomeLookbook({ products, title }: Props) {
  if (products.length === 0) return null;

  const [hero, second, ...rest] = products;

  return (
    <section aria-labelledby="home-lookbook-heading" className="relative">
      <div className="px-2 pt-4 sm:px-3 sm:pt-6 lg:px-4">
        <div className="mb-2 px-3 py-8 text-center md:hidden">
          <p className="font-display text-[0.65rem] uppercase tracking-[0.42em] text-rose-gold">
            Lookbook
          </p>
          <h2 className="mt-3 font-display text-3xl font-light tracking-[0.08em] text-ink">
            {title}
          </h2>
        </div>
        <h2 id="home-lookbook-heading" className="sr-only">
          {title}
        </h2>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-12 md:gap-3">
          {/* Bloco herói: peça grande + frase + segunda peça */}
          {hero ? (
            <LookbookProductTile
              product={hero}
              priority
              className="col-span-2 row-span-2 min-h-[24rem] md:col-span-7 md:row-span-2 md:min-h-[38rem]"
              sizes="(max-width: 768px) 100vw, 58vw"
            />
          ) : null}

          <PhraseCell
            phrase={{
              eyebrow: "Lookbook",
              line: title === "Em destaque"
                ? "Peças com presença — o olhar demora."
                : "Novidades com silhueta que permanece.",
              align: "center",
              tone: "cream",
            }}
            className="col-span-2 min-h-[10rem] md:col-span-5 md:min-h-[18rem]"
          />

          {second ? (
            <LookbookProductTile
              product={second}
              priority
              className="col-span-2 min-h-[20rem] md:col-span-5 md:min-h-[18.5rem]"
              sizes="(max-width: 768px) 100vw, 42vw"
            />
          ) : null}

          {/* Faixa irregular do meio */}
          {rest[0] ? (
            <LookbookProductTile
              product={rest[0]}
              className="col-span-1 min-h-[17rem] md:col-span-4 md:min-h-[26rem]"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          ) : null}
          {rest[1] ? (
            <LookbookProductTile
              product={rest[1]}
              className="col-span-1 min-h-[17rem] md:col-span-4 md:min-h-[26rem]"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          ) : null}

          <PhraseCell
            phrase={{
              eyebrow: "Atelier",
              line: "Do toque ao gesto.",
              align: "start",
              tone: "ink",
            }}
            className={cn(
              "col-span-2 min-h-[11rem] md:col-span-4 md:min-h-[26rem]",
              !rest[0] && !rest[1] && "md:col-span-12"
            )}
          />

          {/* Bloco inferior: peça alta + frase + peças largas */}
          {rest[2] ? (
            <LookbookProductTile
              product={rest[2]}
              className="col-span-2 row-span-2 min-h-[22rem] md:col-span-5 md:row-span-2 md:min-h-[34rem]"
              sizes="(max-width: 768px) 100vw, 42vw"
            />
          ) : null}

          <PhraseCell
            phrase={{
              eyebrow: "Ritmo",
              line: "Vista o que ecoa em você.",
              align: "center",
              tone: "blush",
            }}
            className={cn(
              "col-span-2 min-h-[10rem] md:col-span-7 md:min-h-[15rem]",
              !rest[2] && "hidden"
            )}
          />

          {rest[3] ? (
            <LookbookProductTile
              product={rest[3]}
              className="col-span-1 min-h-[16rem] md:col-span-7 md:min-h-[17.5rem]"
              sizes="(max-width: 768px) 50vw, 58vw"
            />
          ) : null}

          {rest[4] ? (
            <LookbookProductTile
              product={rest[4]}
              className="col-span-1 min-h-[16rem] md:col-span-6 md:min-h-[22rem]"
              sizes="(max-width: 768px) 50vw, 50vw"
            />
          ) : null}
          {rest[5] ? (
            <LookbookProductTile
              product={rest[5]}
              className="col-span-2 min-h-[18rem] md:col-span-6 md:min-h-[22rem]"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : null}
        </div>

        <div className="flex justify-center py-12 sm:py-16">
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
