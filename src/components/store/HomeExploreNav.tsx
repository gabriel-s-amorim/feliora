"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CategoryNavItem } from "@/shared/types/category";
import { cn } from "@/lib/utils";

type Props = {
  categories: CategoryNavItem[];
};

function LeafMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 52 28"
      fill="none"
      aria-hidden
      className={cn("text-rose-gold", className)}
    >
      <path
        d="M26 22C26 22 18 16 12 8.5C17.5 9.5 22.5 13 26 18.5C29.5 13 34.5 9.5 40 8.5C34 16 26 22 26 22Z"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      <path
        d="M26 22V10.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="26" cy="24.5" r="1.1" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

function VineAccent({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 220"
      fill="none"
      aria-hidden
      className={cn("text-rose-gold", className)}
    >
      <path
        d="M40 8C36 42 52 70 38 108C26 140 48 168 40 212"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.45"
      />
      <path
        d="M40 48C28 44 18 52 14 62M40 96C52 90 64 98 70 110M38 148C24 146 16 158 14 170"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}

export function HomeExploreNav({ categories }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    let frame = 0;
    const update = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewH = window.innerHeight || 1;
      // -1 when below, 0 centered, 1 when above
      const progress = (viewH / 2 - (rect.top + rect.height / 2)) / viewH;
      setOffset(Math.max(-1, Math.min(1, progress)));
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reducedMotion]);

  const y = (factor: number) =>
    reducedMotion ? undefined : { transform: `translate3d(0, ${offset * factor}px, 0)` };

  return (
    <section
      ref={sectionRef}
      aria-labelledby="home-explore-heading"
      className="relative overflow-hidden"
    >
      {/* Wash de fundo com parallax suave */}
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-[140%] -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(183,110,121,0.08),transparent_65%)]"
        style={y(28)}
        aria-hidden
      />

      <div
        className="pointer-events-none absolute -left-2 top-0 hidden w-16 opacity-70 md:block lg:w-20"
        style={y(-36)}
        aria-hidden
      >
        <VineAccent className="h-48 w-full lg:h-56" />
      </div>
      <div
        className="pointer-events-none absolute -right-2 bottom-0 hidden w-16 rotate-180 opacity-70 md:block lg:w-20"
        style={y(42)}
        aria-hidden
      >
        <VineAccent className="h-48 w-full lg:h-56" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-12 text-center sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="flex items-center justify-center gap-3" style={y(-14)}>
          <LeafMark className="h-5 w-9 opacity-80" />
          <h2
            id="home-explore-heading"
            className="font-display text-[1.65rem] font-light leading-none tracking-[0.16em] text-ink sm:text-3xl sm:tracking-[0.2em]"
          >
            Explorar
          </h2>
          <LeafMark className="h-5 w-9 scale-x-[-1] opacity-80" />
        </div>

        <p
          className="mx-auto mt-4 max-w-md text-[0.8rem] leading-relaxed text-ink-muted sm:mt-5 sm:text-sm"
          style={y(-8)}
        >
          Escolha o ritmo da peça — do vestido ao detalhe.
        </p>

        <nav className="mt-8 sm:mt-10" aria-label="Categorias" style={y(10)}>
          <ul className="flex flex-wrap items-baseline justify-center gap-x-1 gap-y-3 sm:gap-x-0">
            {categories.map((c, i) => (
              <li key={c.id} className="flex items-baseline">
                {i > 0 ? (
                  <span
                    className="mx-3 hidden text-rose-gold/40 sm:mx-4 sm:inline md:mx-5"
                    aria-hidden
                  >
                    ·
                  </span>
                ) : null}
                <Link
                  href={c.href}
                  className="group inline-flex items-baseline gap-2 px-1.5 py-1 transition-colors"
                  style={
                    reducedMotion
                      ? undefined
                      : {
                          transform: `translate3d(0, ${offset * (6 + i * 3)}px, 0)`,
                        }
                  }
                >
                  <span className="font-display text-[0.6rem] tracking-[0.28em] text-rose-gold/80 transition-colors group-hover:text-rose-gold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="relative font-display text-base tracking-[0.06em] text-ink transition-colors group-hover:text-rose-gold sm:text-lg md:text-xl">
                    {c.name}
                    <span
                      className="absolute -bottom-0.5 left-0 h-px w-0 bg-rose-gold transition-[width] duration-300 group-hover:w-full"
                      aria-hidden
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
