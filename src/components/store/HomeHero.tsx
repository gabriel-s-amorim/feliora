"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Banner } from "@/shared/types/banner";
import { SITE_LOGO_PATH, SITE_NAME, SITE_TAGLINE } from "@/shared/const/site";
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
    }, 6000);
    return () => window.clearInterval(id);
  }, [banners.length]);

  const content = (
    <div className="relative mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-6xl flex-col items-center justify-center px-4 py-16 text-center sm:min-h-[calc(100dvh-4rem)] sm:px-6 lg:px-8">
      <div className="animate-fade-up">
        <Image
          src={SITE_LOGO_PATH}
          alt={SITE_NAME}
          width={280}
          height={280}
          priority
          className={cn(
            "mx-auto w-auto object-contain",
            hasBanners
              ? "h-28 sm:h-36 md:h-40 drop-shadow-sm"
              : "h-36 sm:h-44 md:h-52"
          )}
        />
      </div>

      <p
        className={cn(
          "animate-fade-up animate-delay-1 mt-6 font-display text-[0.7rem] uppercase tracking-[0.42em] sm:mt-8 sm:text-xs",
          hasBanners ? "text-cream/90" : "text-rose-gold"
        )}
      >
        {SITE_NAME}
      </p>

      <h1
        className={cn(
          "animate-fade-up animate-delay-2 mt-3 max-w-xl font-display text-3xl font-light leading-tight tracking-[0.04em] sm:mt-4 sm:text-4xl md:text-5xl",
          hasBanners ? "text-cream" : "text-ink"
        )}
      >
        {SITE_TAGLINE}
      </h1>

      <p
        className={cn(
          "animate-fade-up animate-delay-2 mt-4 max-w-md text-sm leading-relaxed sm:text-base",
          hasBanners ? "text-cream/80" : "text-ink-muted"
        )}
      >
        Peças com acabamento cuidadoso — um ateliê digital com ritmo de lookbook.
      </p>

      <div className="animate-fade-up animate-delay-3 mt-10">
        <Link
          href={current?.linkUrl || "/catalogo"}
          className={cn(
            "inline-flex min-h-12 items-center justify-center border px-8 text-sm tracking-[0.16em] transition-colors duration-300",
            hasBanners
              ? "border-cream bg-cream text-ink hover:bg-cream/90"
              : "border-rose-gold bg-rose-gold text-cream hover:border-rose-gold-light hover:bg-rose-gold-light"
          )}
        >
          Ver nova coleção
        </Link>
      </div>
    </div>
  );

  if (!hasBanners) {
    return (
      <section className="relative isolate min-h-[calc(100dvh-3.5rem)] overflow-hidden sm:min-h-[calc(100dvh-4rem)]">
        <div className="absolute inset-0 bg-gradient-to-b from-ivory via-cream to-[#f3e8df]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          aria-hidden
        >
          <div className="absolute -left-24 top-16 size-[28rem] rounded-full border border-line" />
          <div className="absolute -right-16 bottom-10 size-[22rem] rounded-full border border-line/70" />
        </div>
        <div className="relative">{content}</div>
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
              "absolute inset-0 transition-opacity duration-700",
              active ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            aria-hidden={!active}
          >
            {/* Mobile banner */}
            <Image
              src={mobile}
              alt=""
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover md:hidden"
              style={{ objectPosition: banner.objectPositionMobile }}
            />
            {/* Desktop banner */}
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

      <div className="absolute inset-0 bg-gradient-to-b from-ink/45 via-ink/30 to-ink/55" />

      <div className="relative z-10">{content}</div>

      {banners.length > 1 ? (
        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {banners.map((banner, i) => (
            <button
              key={banner.id}
              type="button"
              aria-label={`Banner ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index % banners.length
                  ? "w-6 bg-cream"
                  : "w-1.5 bg-cream/45"
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
