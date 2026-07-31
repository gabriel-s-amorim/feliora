import Link from "next/link";
import { LookbookProductTile } from "@/components/store/LookbookProductTile";
import type { Product } from "@/shared/types/product";
import { cn } from "@/lib/utils";

type Props = {
  products: Product[];
  title: string;
};

function PhraseBlock({
  eyebrow,
  line,
  tone,
  align = "center",
  className,
}: {
  eyebrow: string;
  line: string;
  tone: "cream" | "ink" | "blush";
  align?: "center" | "start";
  className?: string;
}) {
  const toneCls =
    tone === "ink"
      ? "bg-ink text-cream"
      : tone === "blush"
        ? "bg-[#f3e6df] text-ink"
        : "bg-ivory text-ink";

  return (
    <div
      className={cn(
        "flex flex-col justify-center gap-2 px-5 py-6 sm:px-7",
        toneCls,
        align === "start" ? "items-start text-left" : "items-center text-center",
        className
      )}
    >
      <p
        className={cn(
          "font-display text-[0.6rem] uppercase tracking-[0.36em]",
          tone === "ink" ? "text-rose-gold-light" : "text-rose-gold"
        )}
      >
        {eyebrow}
      </p>
      <p
        className={cn(
          "max-w-[14rem] font-display text-xl font-light leading-snug tracking-[0.03em] sm:text-2xl",
          align !== "start" && "mx-auto"
        )}
      >
        {line}
      </p>
    </div>
  );
}

export function HomeLookbook({ products, title }: Props) {
  if (products.length === 0) return null;

  const [a, b, c, d, e, f, g, h] = products;

  return (
    <section
      aria-labelledby="home-lookbook-heading"
      className="relative pb-20 sm:pb-24 lg:pb-28"
    >
      <div className="px-2 pt-6 sm:px-3 sm:pt-8 lg:px-4">
        <header className="mb-5 flex items-baseline justify-between gap-4 px-1 sm:mb-6">
          <div className="flex items-baseline gap-3">
            <p className="font-display text-[0.6rem] uppercase tracking-[0.4em] text-rose-gold">
              Lookbook
            </p>
            <h2
              id="home-lookbook-heading"
              className="font-display text-xl font-light tracking-[0.06em] text-ink sm:text-2xl"
            >
              {title}
            </h2>
          </div>
          <Link
            href="/catalogo"
            className="text-[10px] tracking-[0.18em] text-ink-muted transition-colors hover:text-rose-gold"
          >
            Ver tudo
          </Link>
        </header>

        <div className="flex flex-col gap-2 md:gap-3">
          {/* Faixa 1: peça grande + frase + peça */}
          {a ? (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-12 md:gap-3">
              <LookbookProductTile
                product={a}
                priority
                className="col-span-2 aspect-[3/4] md:col-span-7 md:aspect-[3/4]"
                sizes="(max-width: 768px) 100vw, 58vw"
              />
              <div className="col-span-2 grid grid-cols-2 gap-2 md:col-span-5 md:grid-cols-1 md:grid-rows-2 md:gap-3">
                <PhraseBlock
                  eyebrow="Lookbook"
                  line="O olhar demora."
                  tone="cream"
                  className="min-h-[10rem] md:min-h-0"
                />
                {b ? (
                  <LookbookProductTile
                    product={b}
                    priority
                    className="aspect-[3/4] md:aspect-auto md:min-h-0 md:h-full"
                    sizes="(max-width: 768px) 50vw, 42vw"
                  />
                ) : (
                  <PhraseBlock
                    eyebrow="Ritmo"
                    line="Vista o que ecoa."
                    tone="blush"
                    className="min-h-[10rem] md:min-h-0"
                  />
                )}
              </div>
            </div>
          ) : null}

          {/* Faixa 2: três peças (ou menos) */}
          {c || d ? (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-12 md:gap-3">
              {c ? (
                <LookbookProductTile
                  product={c}
                  className="aspect-[3/4] md:col-span-4"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              ) : null}
              {d ? (
                <LookbookProductTile
                  product={d}
                  className="aspect-[3/4] md:col-span-4"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              ) : null}
              <PhraseBlock
                eyebrow="Atelier"
                line="Do toque ao gesto."
                tone="ink"
                align="start"
                className={cn(
                  "col-span-2 min-h-[9rem] md:col-span-4 md:min-h-0 md:aspect-[3/4]"
                )}
              />
            </div>
          ) : null}

          {/* Faixa 3: peça em destaque + lateral */}
          {e ? (
            f ? (
              <div className="grid grid-cols-2 gap-2 md:grid-cols-12 md:gap-3">
                <div className="col-span-2 grid grid-cols-2 gap-2 md:col-span-5 md:grid-cols-1 md:grid-rows-2 md:gap-3">
                  <PhraseBlock
                    eyebrow="Ritmo"
                    line="Vista o que ecoa."
                    tone="blush"
                    className="min-h-[10rem] md:min-h-0"
                  />
                  <LookbookProductTile
                    product={f}
                    className="aspect-[3/4] md:aspect-auto md:min-h-0 md:h-full"
                    sizes="(max-width: 768px) 50vw, 42vw"
                  />
                </div>
                <LookbookProductTile
                  product={e}
                  className="col-span-2 aspect-[3/4] md:col-span-7"
                  sizes="(max-width: 768px) 100vw, 58vw"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 md:grid-cols-12 md:gap-3">
                <LookbookProductTile
                  product={e}
                  className="col-span-2 aspect-[3/4] md:col-span-8 md:col-start-3"
                  sizes="(max-width: 768px) 100vw, 66vw"
                />
              </div>
            )
          ) : null}

          {/* Faixa 4: par final */}
          {g || h ? (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-12 md:gap-3">
              {g ? (
                <LookbookProductTile
                  product={g}
                  className={cn(
                    "aspect-[3/4]",
                    h ? "md:col-span-6" : "col-span-2 md:col-span-6 md:col-start-4"
                  )}
                  sizes="(max-width: 768px) 50vw, 50vw"
                />
              ) : null}
              {h ? (
                <LookbookProductTile
                  product={h}
                  className="aspect-[3/4] md:col-span-6"
                  sizes="(max-width: 768px) 50vw, 50vw"
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
