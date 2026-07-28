"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Banner } from "@/shared/types/banner";
import { SITE_TAGLINE } from "@/shared/const/site";
import { cn } from "@/lib/utils";

type Props = {
  banners: Banner[];
};

export function HomeHero({ banners }: Props) {
  const [index, setIndex] = useState(0);
  const hasBanners = banners.length > 0;
  const current = hasBanners ? banners[index % banners.length] : null;

  useEffect(() => {
    if (banners.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, 7000);
    return () => window.clearInterval(id);
  }, [banners.length]);

  const headline =
    current?.title?.trim() ||
    current?.altText?.trim() ||
    SITE_TAGLINE;
  const support =
    current?.title?.trim() || current?.altText?.trim()
      ? SITE_TAGLINE
      : "Peças com presença — ritmo de lookbook.";

  const content = (
    <div className="relative mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-3xl flex-col items-center justify-end px-5 pb-16 pt-24 text-center sm:min-h-[calc(100dvh-4rem)] sm:px-8 sm:pb-20 md:justify-center md:pb-24">
      <h1
        className={cn(
          "animate-fade-up font-display text-[1.85rem] font-light leading-[1.15] tracking-[0.06em] sm:text-4xl md:text-5xl",
          hasBanners ? "text-cream" : "text-ink"
        )}
      >
        {headline}
      </h1>

      <p
        className={cn(
          "animate-fade-up animate-delay-1 mt-4 max-w-sm text-sm leading-relaxed sm:mt-5 sm:text-[0.95rem]",
          hasBanners ? "text-cream/85" : "text-ink-muted"
        )}
      >
        {support}
      </p>

      <div className="animate-fade-up animate-delay-2 mt-8 sm:mt-10">
        <Link
          href={current?.linkUrl || "/catalogo"}
          className={cn(
            "inline-flex min-h-11 items-center justify-center px-9 text-[11px] tracking-[0.22em] transition-colors duration-300 sm:min-h-12 sm:text-xs",
            hasBanners
              ? "border border-cream/90 bg-cream text-ink hover:bg-cream/90"
              : "border border-ink bg-ink text-cream hover:bg-ink/90"
          )}
        >
          Descobrir
        </Link>
      </div>
    </div>
  );

  if (!hasBanners) {
    return (
      <section className="relative isolate min-h-[calc(100dvh-3.5rem)] overflow-hidden sm:min-h-[calc(100dvh-4rem)]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cream/40" />
        <div className="relative z-10">{content}</div>
      </section>
    );
  }

  return (
    <section className="relative isolate min-h-[calc(100dvh-3.5rem)] overflow-hidden sm:min-h-[calc(100dvh-4rem)]">
      {banners.map((banner, i) => {
        const desktop = banner.imageUrl;
        const mobile = banner.imageUrlMobile || banner.imageUrl;
        const active = i === index % banners.length;

        return (
          <div
            key={banner.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000",
              active ? "opacity-100" : "pointer-events-none opacity-0"
            )}
            aria-hidden={!active}
          >
            <Image
              src={mobile}
              alt=""
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover md:hidden"
              style={{ objectPosition: banner.objectPositionMobile }}
            />
            <Image
              src={desktop}
              alt=""
              fill
              priority={i === 0}
              sizes="100vw"
              className="hidden object-cover md:block"
              style={{ objectPosition: banner.objectPosition }}
            />
          </div>
        );
      })}

      {/* Overlay leve — a foto continua protagonista */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/20 to-ink/10" />

      <div className="relative z-10">{content}</div>

      {banners.length > 1 ? (
        <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {banners.map((banner, i) => (
            <button
              key={banner.id}
              type="button"
              aria-label={`Banner ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-px rounded-full transition-all",
                i === index % banners.length
                  ? "w-8 bg-cream"
                  : "w-4 bg-cream/40"
              )}
            />
          ))}
        </div>
      ) : null}

      <span className="sr-only">
        {current?.altText || current?.title || "Banner"}
      </span>
    </section>
  );
}
