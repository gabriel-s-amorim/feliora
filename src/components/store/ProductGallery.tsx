"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type ProductGalleryProps = {
  name: string;
  images: string[];
};

export function ProductGallery({ name, images }: ProductGalleryProps) {
  const gallery = images.filter(Boolean);
  const [index, setIndex] = useState(0);
  const current = gallery[index] ?? null;

  if (gallery.length === 0) {
    return (
      <div className="flex aspect-[3/4] items-center justify-center border border-line bg-ivory">
        <span className="font-display tracking-[0.2em] text-ink-muted">
          Feliora
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-5">
      <div className="relative aspect-[3/4] overflow-hidden bg-ivory">
        <Image
          src={current!}
          alt={name}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
        {gallery.length > 1 ? (
          <>
            <button
              type="button"
              className="absolute left-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center bg-cream/90 text-lg text-ink transition-colors hover:bg-cream"
              aria-label="Imagem anterior"
              onClick={() =>
                setIndex((i) => (i - 1 + gallery.length) % gallery.length)
              }
            >
              ‹
            </button>
            <button
              type="button"
              className="absolute right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center bg-cream/90 text-lg text-ink transition-colors hover:bg-cream"
              aria-label="Próxima imagem"
              onClick={() => setIndex((i) => (i + 1) % gallery.length)}
            >
              ›
            </button>
          </>
        ) : null}
      </div>

      {gallery.length > 1 ? (
        <ul className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {gallery.map((src, i) => (
            <li key={`${src}-${i}`} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ver imagem ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  "relative block h-20 w-14 overflow-hidden border transition-colors sm:h-24 sm:w-16",
                  i === index
                    ? "border-ink"
                    : "border-transparent opacity-70 hover:opacity-100"
                )}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
