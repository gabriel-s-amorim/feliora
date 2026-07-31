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
  tone: "cream" | "ink" | "blush";
  align?: "center" | "start";
};

const PHRASES: Phrase[] = [
  {
    eyebrow: "Lookbook",
    line: "O olhar demora.",
    tone: "cream",
    align: "center",
  },
  {
    eyebrow: "Atelier",
    line: "Do toque ao gesto.",
    tone: "ink",
    align: "start",
  },
  {
    eyebrow: "Ritmo",
    line: "Vista o que ecoa.",
    tone: "blush",
    align: "center",
  },
  {
    eyebrow: "Presença",
    line: "Silhueta que permanece.",
    tone: "cream",
    align: "center",
  },
];

/** Irregular: mobile 6 cols · desktop 12 cols */
const PRODUCT_SPANS = [
  "col-span-4 row-span-2 min-h-[19rem] md:col-span-7 md:min-h-[36rem]",
  "col-span-2 min-h-[9rem] md:col-span-5 md:min-h-[17rem]",
  "col-span-3 min-h-[15rem] md:col-span-4 md:min-h-[26rem]",
  "col-span-3 min-h-[15rem] md:col-span-4 md:min-h-[26rem]",
  "col-span-4 row-span-2 min-h-[18rem] md:col-span-5 md:row-span-2 md:min-h-[34rem]",
  "col-span-2 min-h-[8.5rem] md:col-span-7 md:min-h-[16rem]",
  "col-span-3 min-h-[14rem] md:col-span-6 md:min-h-[24rem]",
  "col-span-3 min-h-[14rem] md:col-span-6 md:min-h-[24rem]",
] as const;

const PHRASE_PLACEMENTS: {
  after: number;
  phrase: number;
  className: string;
}[] = [
  {
    after: 0,
    phrase: 0,
    className: "col-span-2 min-h-[9rem] md:col-span-5 md:min-h-[17rem]",
  },
  {
    after: 3,
    phrase: 1,
    className: "col-span-6 min-h-[7rem] md:col-span-4 md:min-h-[26rem]",
  },
  {
    after: 4,
    phrase: 2,
    className: "col-span-2 min-h-[8.5rem] md:col-span-7 md:min-h-[16rem]",
  },
  {
    after: 5,
    phrase: 3,
    className: "col-span-6 min-h-[7rem] md:col-span-12 md:min-h-[9rem]",
  },
];

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

  return (
    <div
      className={cn(
        "flex flex-col justify-center gap-2 px-4 py-5 sm:px-6",
        tone,
        phrase.align === "start"
          ? "items-start text-left"
          : "items-center text-center",
        className
      )}
    >
      <p
        className={cn(
          "font-display text-[0.6rem] uppercase tracking-[0.36em]",
          phrase.tone === "ink" ? "text-rose-gold-light" : "text-rose-gold"
        )}
      >
        {phrase.eyebrow}
      </p>
      <p
        className={cn(
          "max-w-[13rem] font-display text-lg font-light leading-snug tracking-[0.03em] sm:text-xl md:text-[1.4rem]",
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

  type Cell =
    | { kind: "product"; product: Product; span: string; priority: boolean }
    | { kind: "phrase"; phrase: Phrase; span: string };

  const cells: Cell[] = [];
  const used = new Set<number>();

  products.forEach((product, i) => {
    cells.push({
      kind: "product",
      product,
      span: PRODUCT_SPANS[i % PRODUCT_SPANS.length]!,
      priority: i < 2,
    });

    for (const slot of PHRASE_PLACEMENTS) {
      if (slot.after === i && !used.has(slot.phrase)) {
        used.add(slot.phrase);
        cells.push({
          kind: "phrase",
          phrase: PHRASES[slot.phrase]!,
          span: slot.className,
        });
      }
    }
  });

  return (
    <section aria-labelledby="home-lookbook-heading" className="relative">
      <div className="px-2 pt-4 sm:px-3 sm:pt-6 lg:px-4">
        <header className="mb-3 flex items-baseline justify-between gap-4 px-1 sm:mb-4">
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

        <div className="grid grid-cols-6 gap-2 md:grid-cols-12 md:gap-3">
          {cells.map((cell, i) =>
            cell.kind === "phrase" ? (
              <PhraseCell
                key={`phrase-${i}`}
                phrase={cell.phrase}
                className={cell.span}
              />
            ) : (
              <LookbookProductTile
                key={cell.product.id}
                product={cell.product}
                priority={cell.priority}
                className={cell.span}
                sizes={
                  cell.span.includes("col-span-4") ||
                  cell.span.includes("md:col-span-7")
                    ? "(max-width: 768px) 70vw, 55vw"
                    : "(max-width: 768px) 40vw, 35vw"
                }
              />
            )
          )}
        </div>
      </div>
    </section>
  );
}
