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
    <div className="space-y-3">
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
              className="absolute left-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center bg-cream/90 text-ink"
              aria-label="Imagem anterior"
              onClick={() =>
                setIndex((i) => (i - 1 + gallery.length) % gallery.length)
              }
            >
              ‹
            </button>
            <button
              type="button"
              className="absolute right-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center bg-cream/90 text-ink"
              aria-label="Próxima imagem"
              onClick={() => setIndex((i) => (i + 1) % gallery.length)}
            >
              ›
            </button>
          </>
        ) : null}
      </div>

      {gallery.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {gallery.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              className={cn(
                "relative h-16 w-12 shrink-0 overflow-hidden border",
                i === index ? "border-rose-gold" : "border-transparent"
              )}
            >
              <Image src={src} alt="" fill className="object-cover" sizes="48px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
