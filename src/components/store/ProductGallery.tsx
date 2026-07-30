"use client";

import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";
import Image from "next/image";
import { ZoomIn } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type ProductGalleryProps = {
  name: string;
  images: string[];
};

export function ProductGallery({ name, images }: ProductGalleryProps) {
  const gallery = images.filter(Boolean);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    Fancybox.bind(container, '[data-fancybox="product-gallery"]', {
      theme: "light",
    });

    return () => {
      Fancybox.unbind(container);
      Fancybox.close();
    };
  }, [gallery.length]);

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
    <div
      ref={containerRef}
      className="grid grid-cols-2 gap-2.5 sm:gap-4"
    >
      {gallery.map((src, index) => {
        const featured = index === 0;
        return (
          <a
            key={`${src}-${index}`}
            href={src}
            data-fancybox="product-gallery"
            data-caption={`${name} — imagem ${index + 1} de ${gallery.length}`}
            aria-label={`Ampliar imagem ${index + 1}`}
            className={cn(
              "group relative block overflow-hidden border border-line/40 bg-ivory",
              featured
                ? "col-span-2 aspect-[4/3]"
                : "aspect-[4/5]"
            )}
          >
            <Image
              src={src}
              alt={featured ? name : `${name} — imagem ${index + 1}`}
              fill
              priority={featured}
              quality={90}
              sizes={
                featured
                  ? "(max-width: 768px) 100vw, 58vw"
                  : "(max-width: 768px) 50vw, 29vw"
              }
              className="object-contain transition-transform duration-500 ease-out group-hover:scale-[1.015]"
            />
            <span className="absolute bottom-3 right-3 flex size-10 items-center justify-center rounded-full bg-cream/90 text-ink opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100">
              <ZoomIn className="size-4" aria-hidden />
            </span>
          </a>
        );
      })}
    </div>
  );
}
