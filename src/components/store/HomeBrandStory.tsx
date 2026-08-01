"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bookmark,
  Heart,
  MessageCircle,
  Share2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { SITE_NAME } from "@/shared/const/site";
import { cn } from "@/lib/utils";

type Props = {
  videoUrl: string;
};

const FAKE_STATS = [
  { icon: Heart, label: "Curtidas", value: "12,4 mil" },
  { icon: MessageCircle, label: "Comentários", value: "328" },
  { icon: Bookmark, label: "Salvos", value: "1,9 mil" },
  { icon: Share2, label: "Compartilhamentos", value: "642" },
] as const;

export function HomeBrandStory({ videoUrl }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio > 0.35),
      { threshold: [0, 0.35, 0.6] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || failed) return;

    if (inView) {
      video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      video.pause();
      setPlaying(false);
    }
  }, [inView, failed, ready]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
  }, [muted]);

  function toggleMute() {
    setMuted((m) => !m);
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!video || failed) return;
    if (video.paused) {
      void video.play().then(() => setPlaying(true));
    } else {
      video.pause();
      setPlaying(false);
    }
  }

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

      <div className="relative mx-auto max-w-5xl px-5 sm:px-8">
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
            A criadora apresenta o propósito da marca — delicadeza, presença e
            o olhar por trás de cada peça.
          </p>
        </header>

        <div className="animate-fade-up animate-delay-3 flex justify-center">
          <div className="relative w-full max-w-[320px] sm:max-w-[340px]">
            {/* Frame vertical */}
            <div
              className={cn(
                "relative aspect-[9/16] overflow-hidden rounded-[1.75rem]",
                "bg-ink shadow-[0_28px_80px_-28px_rgba(44,36,27,0.55)]",
                "ring-1 ring-ink/10"
              )}
            >
              {!failed ? (
                <video
                  ref={videoRef}
                  className="absolute inset-0 h-full w-full object-cover"
                  src={videoUrl}
                  playsInline
                  loop
                  muted={muted}
                  preload="metadata"
                  poster={undefined}
                  onLoadedData={() => setReady(true)}
                  onCanPlay={() => setReady(true)}
                  onError={() => setFailed(true)}
                  onClick={togglePlay}
                  aria-label={`Vídeo de apresentação da ${SITE_NAME}`}
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

              {/* Gradientes de leitura */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-ink/45 to-transparent"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-ink/75 via-ink/35 to-transparent"
              />

              {/* Ícones de engajamento (decorativos) */}
              <ul
                aria-hidden
                className="absolute bottom-28 right-3 z-10 flex flex-col items-center gap-4 sm:bottom-32 sm:right-3.5 sm:gap-5"
              >
                {FAKE_STATS.map(({ icon: Icon, value }) => (
                  <li key={value} className="flex flex-col items-center gap-1">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cream/10 text-cream backdrop-blur-sm ring-1 ring-cream/20">
                      <Icon className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.6} />
                    </span>
                    <span className="text-[0.65rem] font-medium tracking-wide text-cream/90">
                      {value}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Caption inferior */}
              <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-5 pt-8 sm:px-5 sm:pb-6">
                <p className="font-display text-[0.7rem] uppercase tracking-[0.28em] text-rose-gold-light">
                  @{SITE_NAME.toLowerCase()}
                </p>
                <p className="mt-1.5 max-w-[75%] text-[0.8rem] leading-snug text-cream/95 sm:text-[0.85rem]">
                  A origem da {SITE_NAME} — moda com delicadeza e intenção.
                </p>
                {!playing && ready && !failed ? (
                  <p className="mt-3 text-[0.65rem] tracking-[0.16em] text-cream/55 uppercase">
                    Toque para pausar
                  </p>
                ) : null}
              </div>

              {/* Som */}
              {!failed ? (
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

              {/* Indicador de loading sutil */}
              {!ready && !failed ? (
                <div
                  aria-hidden
                  className="absolute inset-0 flex items-center justify-center bg-ink/40"
                >
                  <span className="h-8 w-8 animate-pulse rounded-full border border-cream/30 border-t-cream/80" />
                </div>
              ) : null}
            </div>

            <p className="mt-5 text-center font-display text-[0.65rem] uppercase tracking-[0.32em] text-ink-muted/80">
              Apresentação
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
