"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  Bookmark,
  Heart,
  MessageCircle,
  Play,
  Share2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { SITE_NAME } from "@/shared/const/site";
import { cn } from "@/lib/utils";

export type BrandStoryCollageItem = {
  type: "image" | "video";
  src: string;
  alt: string;
  silent?: boolean;
};

type Props = {
  videoUrl: string;
  collage: BrandStoryCollageItem[];
};

const FAKE_STATS = [
  { icon: Heart, label: "Curtidas", value: "12,4 mil" },
  { icon: MessageCircle, label: "Comentários", value: "328" },
  { icon: Bookmark, label: "Salvos", value: "1,9 mil" },
  { icon: Share2, label: "Compartilhamentos", value: "642" },
] as const;

const TILTS = [-7, 4, -3, 6, -5, 3, -4] as const;

function CollageTile({
  item,
  tilt,
  active,
  inviting,
  onSelect,
  className,
}: {
  item: BrandStoryCollageItem;
  tilt: number;
  active: boolean;
  inviting: boolean;
  onSelect: (item: BrandStoryCollageItem) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      aria-pressed={active}
      aria-label={`Ver no centro: ${item.alt}`}
      className={cn(
        "group relative mx-auto block w-[7.5rem] shrink-0 cursor-pointer bg-cream p-1.5 pb-5 text-left shadow-[0_12px_28px_-10px_rgba(44,36,27,0.45)] transition-[transform,box-shadow] duration-300 sm:w-[8.75rem] lg:w-[9.25rem]",
        "ring-1 ring-ink/8 hover:z-20 hover:shadow-[0_18px_36px_-12px_rgba(44,36,27,0.55)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-gold/60",
        active && "z-20 ring-2 ring-rose-gold shadow-[0_18px_40px_-10px_rgba(183,110,121,0.45)]",
        inviting && !active && "animate-collage-invite",
        className
      )}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <span
        aria-hidden
        className="absolute -top-2 left-1/2 z-10 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-gradient-to-b from-rose-gold-light to-rose-gold shadow-sm ring-1 ring-ink/10"
      />
      <div className="relative aspect-[3/4] overflow-hidden bg-ivory">
        {item.type === "image" ? (
          <Image
            src={item.src}
            alt=""
            fill
            sizes="160px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <video
            src={item.src}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            muted
            playsInline
            loop
            autoPlay
            preload="metadata"
            tabIndex={-1}
          />
        )}

        {/* Convite ao clique */}
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-ink/0 transition-colors duration-300 group-hover:bg-ink/25",
            inviting && !active && "bg-ink/10"
          )}
        >
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full bg-cream/90 text-ink shadow-md ring-1 ring-cream/40 transition-all duration-300",
              "scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100",
              inviting && !active && "scale-100 opacity-90 animate-pulse"
            )}
          >
            <Play className="h-3.5 w-3.5 translate-x-px" fill="currentColor" strokeWidth={0} />
          </span>
        </span>
      </div>

      <span
        className={cn(
          "pointer-events-none absolute bottom-1.5 left-0 right-0 text-center font-display text-[0.55rem] uppercase tracking-[0.18em] text-ink-muted/0 transition-colors duration-300 group-hover:text-rose-gold",
          inviting && !active && "text-rose-gold/70"
        )}
      >
        Ver
      </span>
    </button>
  );
}

function ClotheslineRail({
  items,
  direction,
  activeSrc,
  inviting,
  onSelect,
  className,
}: {
  items: BrandStoryCollageItem[];
  direction: "up" | "down";
  activeSrc: string | null;
  inviting: boolean;
  onSelect: (item: BrandStoryCollageItem) => void;
  className?: string;
}) {
  const loop = [...items, ...items];

  return (
    <div
      className={cn(
        "group/rail relative hidden h-[min(36rem,72svh)] overflow-hidden lg:block",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-y-3 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-rose-gold/35 to-transparent" />

      <div
        className={cn(
          "flex flex-col gap-10 py-6 will-change-transform",
          direction === "up"
            ? "animate-clothesline-up"
            : "animate-clothesline-down",
          "group-hover/rail:[animation-play-state:paused]"
        )}
      >
        {loop.map((item, i) => (
          <CollageTile
            key={`${item.src}-${i}`}
            item={item}
            tilt={TILTS[i % TILTS.length]}
            active={activeSrc === item.src}
            inviting={inviting}
            onSelect={onSelect}
          />
        ))}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-[#f6ebe3] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-ivory to-transparent" />
    </div>
  );
}

function ClotheslineStrip({
  items,
  activeSrc,
  inviting,
  onSelect,
}: {
  items: BrandStoryCollageItem[];
  activeSrc: string | null;
  inviting: boolean;
  onSelect: (item: BrandStoryCollageItem) => void;
}) {
  const loop = [...items, ...items];

  return (
    <div className="group/strip relative mt-8 overflow-hidden lg:hidden">
      <p className="mb-3 text-center font-display text-[0.6rem] uppercase tracking-[0.28em] text-rose-gold/80">
        Toque para abrir no centro
      </p>
      <div className="pointer-events-none absolute inset-x-6 top-[2.35rem] h-px bg-gradient-to-r from-transparent via-rose-gold/40 to-transparent" />
      <div
        className={cn(
          "flex w-max gap-5 px-4 py-4 will-change-transform animate-clothesline-x",
          "group-hover/strip:[animation-play-state:paused] group-active/strip:[animation-play-state:paused]"
        )}
      >
        {loop.map((item, i) => (
          <CollageTile
            key={`strip-${item.src}-${i}`}
            item={item}
            tilt={TILTS[i % TILTS.length]}
            active={activeSrc === item.src}
            inviting={inviting}
            onSelect={onSelect}
            className="w-[6.75rem] sm:w-[7.5rem]"
          />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#f6ebe3] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-ivory to-transparent" />
    </div>
  );
}

export function HomeBrandStory({ videoUrl, collage }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState<BrandStoryCollageItem | null>(null);
  const [hasPicked, setHasPicked] = useState(false);

  const leftItems = collage.filter((_, i) => i % 2 === 0);
  const rightItems = collage.filter((_, i) => i % 2 === 1);
  const leftRail = leftItems.length > 0 ? leftItems : collage;
  const rightRail =
    rightItems.length > 0 ? rightItems : [...collage].reverse();

  const showingVideo = !active || active.type === "video";
  const mainVideoSrc = active?.type === "video" ? active.src : videoUrl;
  const mainIsSilent = Boolean(active?.type === "video" && active.silent);
  const effectiveMuted = mainIsSilent ? true : muted;
  const mainCaption = active
    ? active.alt
    : `A origem da ${SITE_NAME} — moda com delicadeza e intenção.`;
  const stageLabel = active ? "Bastidores" : "Apresentação";

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) =>
        setInView(entry.isIntersecting && entry.intersectionRatio > 0.35),
      { threshold: [0, 0.35, 0.6] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    setReady(false);
    setFailed(false);
    setPlaying(false);
  }, [mainVideoSrc, active?.src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || failed || !showingVideo) return;

    if (inView) {
      video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      video.pause();
      setPlaying(false);
    }
  }, [inView, failed, ready, showingVideo, mainVideoSrc]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = effectiveMuted;
  }, [effectiveMuted, mainVideoSrc]);

  function selectItem(item: BrandStoryCollageItem) {
    setHasPicked(true);
    setActive((prev) => (prev?.src === item.src ? null : item));
  }

  function restorePresentation() {
    setActive(null);
  }

  function toggleMute() {
    if (mainIsSilent) return;
    setMuted((m) => !m);
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!video || failed || !showingVideo) return;
    if (video.paused) {
      void video.play().then(() => setPlaying(true));
    } else {
      video.pause();
      setPlaying(false);
    }
  }

  const inviting = !hasPicked && collage.length > 0;

  return (
    <section
      ref={sectionRef}
      aria-labelledby="home-brand-story-heading"
      className="relative overflow-hidden pb-20 pt-4 sm:pb-24 sm:pt-6 lg:pb-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cream via-[#f6ebe3] to-ivory"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-rose-gold/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 bottom-1/4 h-64 w-64 rounded-full bg-blush/20 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mx-auto mb-10 max-w-lg text-center sm:mb-12">
          <p className="animate-fade-up font-display text-[0.6rem] uppercase tracking-[0.4em] text-rose-gold">
            {SITE_NAME}
          </p>
          <h2
            id="home-brand-story-heading"
            className="animate-fade-up animate-delay-1 mt-3 font-display text-3xl font-light tracking-[0.06em] text-ink sm:text-4xl"
          >
            Nossa história
          </h2>
          <p className="animate-fade-up animate-delay-2 mx-auto mt-4 max-w-sm text-sm leading-relaxed text-ink-muted sm:text-[0.95rem]">
            Do molde à peça — o atelier por trás da marca, contado pela
            criadora.
          </p>
          {collage.length > 0 ? (
            <p
              className={cn(
                "animate-fade-up animate-delay-3 mx-auto mt-4 inline-flex items-center gap-2 font-display text-[0.65rem] uppercase tracking-[0.28em] text-rose-gold transition-opacity",
                hasPicked ? "opacity-60" : "opacity-100"
              )}
            >
              <Play
                className={cn(
                  "h-3 w-3",
                  inviting && "animate-pulse"
                )}
                fill="currentColor"
                strokeWidth={0}
              />
              {hasPicked
                ? "Toque de novo para voltar à apresentação"
                : "Toque no varal e abra no centro"}
            </p>
          ) : null}
        </header>

        <div className="animate-fade-up animate-delay-3 grid items-center gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)_minmax(0,1fr)] lg:gap-6 xl:gap-10">
          {collage.length > 0 ? (
            <ClotheslineRail
              items={leftRail}
              direction="up"
              activeSrc={active?.src ?? null}
              inviting={inviting}
              onSelect={selectItem}
            />
          ) : (
            <div className="hidden lg:block" />
          )}

          <div className="relative mx-auto w-full max-w-[320px] sm:max-w-[340px]">
            <div
              className={cn(
                "relative aspect-[9/16] overflow-hidden rounded-[1.75rem]",
                "bg-ink shadow-[0_28px_80px_-28px_rgba(44,36,27,0.55)]",
                "ring-1 ring-ink/10 transition-shadow duration-500",
                active && "shadow-[0_28px_80px_-24px_rgba(183,110,121,0.4)]"
              )}
            >
              {active?.type === "image" ? (
                <Image
                  src={active.src}
                  alt={active.alt}
                  fill
                  sizes="(max-width: 768px) 90vw, 340px"
                  className="object-cover animate-fade-in"
                  priority
                />
              ) : !failed ? (
                <video
                  key={mainVideoSrc}
                  ref={videoRef}
                  className="absolute inset-0 h-full w-full object-cover"
                  src={mainVideoSrc}
                  playsInline
                  loop
                  muted={effectiveMuted}
                  preload="metadata"
                  onLoadedData={() => setReady(true)}
                  onCanPlay={() => setReady(true)}
                  onError={() => setFailed(true)}
                  onClick={togglePlay}
                  aria-label={
                    active
                      ? active.alt
                      : `Vídeo de apresentação da ${SITE_NAME}`
                  }
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-[#3a3028] to-ink px-8 text-center">
                  <p className="font-display text-lg font-light tracking-[0.08em] text-cream">
                    Em breve
                  </p>
                  <p className="text-xs leading-relaxed text-cream/65">
                    O vídeo de apresentação estará disponível aqui.
                  </p>
                </div>
              )}

              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-ink/45 to-transparent"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-ink/75 via-ink/35 to-transparent"
              />

              <ul
                aria-hidden
                className="absolute bottom-28 right-3 z-10 flex flex-col items-center gap-4 sm:bottom-32 sm:right-3.5 sm:gap-5"
              >
                {FAKE_STATS.map(({ icon: Icon, value }) => (
                  <li key={value} className="flex flex-col items-center gap-1">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cream/10 text-cream backdrop-blur-sm ring-1 ring-cream/20">
                      <Icon
                        className="h-[1.15rem] w-[1.15rem]"
                        strokeWidth={1.6}
                      />
                    </span>
                    <span className="text-[0.65rem] font-medium tracking-wide text-cream/90">
                      {value}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-5 pt-8 sm:px-5 sm:pb-6">
                <p className="font-display text-[0.7rem] uppercase tracking-[0.28em] text-rose-gold-light">
                  @{SITE_NAME.toLowerCase()}
                </p>
                <p className="mt-1.5 max-w-[75%] text-[0.8rem] leading-snug text-cream/95 sm:text-[0.85rem]">
                  {mainCaption}
                </p>
                {showingVideo && !playing && ready && !failed ? (
                  <p className="mt-3 text-[0.65rem] uppercase tracking-[0.16em] text-cream/55">
                    Toque para pausar
                  </p>
                ) : null}
                {active ? (
                  <button
                    type="button"
                    onClick={restorePresentation}
                    className="mt-3 text-[0.65rem] uppercase tracking-[0.18em] text-cream/70 underline-offset-4 transition-colors hover:text-cream hover:underline"
                  >
                    Voltar à apresentação
                  </button>
                ) : null}
              </div>

              {showingVideo && !failed && !mainIsSilent ? (
                <button
                  type="button"
                  onClick={toggleMute}
                  className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-ink/35 text-cream backdrop-blur-md ring-1 ring-cream/25 transition-colors hover:bg-ink/50"
                  aria-label={muted ? "Ativar som" : "Silenciar"}
                >
                  {muted ? (
                    <VolumeX className="h-4 w-4" strokeWidth={1.75} />
                  ) : (
                    <Volume2 className="h-4 w-4" strokeWidth={1.75} />
                  )}
                </button>
              ) : null}

              {showingVideo && !ready && !failed ? (
                <div
                  aria-hidden
                  className="absolute inset-0 flex items-center justify-center bg-ink/40"
                >
                  <span className="h-8 w-8 animate-pulse rounded-full border border-cream/30 border-t-cream/80" />
                </div>
              ) : null}
            </div>

            <p className="mt-5 text-center font-display text-[0.65rem] uppercase tracking-[0.32em] text-ink-muted/80">
              {stageLabel}
            </p>
          </div>

          {collage.length > 0 ? (
            <ClotheslineRail
              items={rightRail}
              direction="down"
              activeSrc={active?.src ?? null}
              inviting={inviting}
              onSelect={selectItem}
            />
          ) : (
            <div className="hidden lg:block" />
          )}
        </div>

        {collage.length > 0 ? (
          <ClotheslineStrip
            items={collage}
            activeSrc={active?.src ?? null}
            inviting={inviting}
            onSelect={selectItem}
          />
        ) : null}
      </div>
    </section>
  );
}
