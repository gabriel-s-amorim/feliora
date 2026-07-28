"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Motif = "branch" | "flower" | "sprig" | "arc";
type Anchor =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "mid-left"
  | "mid-right";
type Tone = "rose-gold" | "earth";

export type FloralItem = {
  motif: Motif;
  position: Anchor;
  /** Largura visual em px */
  size?: number;
  rotate?: number;
  flipX?: boolean;
  flipY?: boolean;
  /** Multiplicador de parallax (0–1) */
  depth?: number;
  tone?: Tone;
  /** Opacidade 0–1 */
  opacity?: number;
  className?: string;
};

type Props = {
  className?: string;
  items?: FloralItem[];
  /** Layouts prontos para seções comuns */
  variant?: "featured" | "section" | "corners";
};

const PRESETS: Record<NonNullable<Props["variant"]>, FloralItem[]> = {
  featured: [
    {
      motif: "branch",
      position: "top-left",
      size: 300,
      rotate: -6,
      depth: 0.55,
      tone: "rose-gold",
      opacity: 0.12,
    },
    {
      motif: "flower",
      position: "top-right",
      size: 150,
      rotate: 14,
      depth: 0.32,
      tone: "earth",
      opacity: 0.1,
    },
    {
      motif: "sprig",
      position: "mid-left",
      size: 210,
      rotate: -22,
      flipX: true,
      depth: 0.7,
      tone: "earth",
      opacity: 0.11,
    },
    {
      motif: "arc",
      position: "mid-right",
      size: 240,
      rotate: 4,
      depth: 0.4,
      tone: "rose-gold",
      opacity: 0.1,
    },
    {
      motif: "branch",
      position: "bottom-right",
      size: 280,
      rotate: 172,
      depth: 0.6,
      tone: "rose-gold",
      opacity: 0.11,
    },
    {
      motif: "flower",
      position: "bottom-left",
      size: 130,
      rotate: -24,
      flipX: true,
      depth: 0.28,
      tone: "earth",
      opacity: 0.09,
    },
  ],
  section: [
    {
      motif: "sprig",
      position: "top-left",
      size: 190,
      rotate: -14,
      depth: 0.45,
      tone: "rose-gold",
      opacity: 0.1,
    },
    {
      motif: "arc",
      position: "top-right",
      size: 170,
      rotate: 10,
      depth: 0.35,
      tone: "earth",
      opacity: 0.09,
    },
    {
      motif: "branch",
      position: "bottom-right",
      size: 210,
      rotate: 178,
      depth: 0.5,
      tone: "rose-gold",
      opacity: 0.1,
    },
  ],
  corners: [
    {
      motif: "flower",
      position: "top-left",
      size: 130,
      rotate: -16,
      depth: 0.4,
      tone: "rose-gold",
      opacity: 0.1,
    },
    {
      motif: "branch",
      position: "bottom-right",
      size: 220,
      rotate: 170,
      depth: 0.55,
      tone: "earth",
      opacity: 0.11,
    },
  ],
};

const ANCHOR_CLASS: Record<Anchor, string> = {
  "top-left": "left-0 top-0 -translate-x-[18%] -translate-y-[12%]",
  "top-right": "right-0 top-0 translate-x-[18%] -translate-y-[10%]",
  "bottom-left": "bottom-0 left-0 -translate-x-[15%] translate-y-[18%]",
  "bottom-right": "bottom-0 right-0 translate-x-[18%] translate-y-[12%]",
  "mid-left": "left-0 top-1/2 -translate-x-[42%] -translate-y-1/2",
  "mid-right": "right-0 top-1/2 translate-x-[40%] -translate-y-1/2",
};

const TONE_VAR: Record<Tone, string> = {
  "rose-gold": "var(--color-rose-gold)",
  earth: "var(--color-earth)",
};

const MAX_SHIFT = 12;

function strokeProps(tone: Tone, opacity: number, width = 1.25) {
  return {
    fill: "none" as const,
    stroke: TONE_VAR[tone],
    strokeWidth: width,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    opacity,
  };
}

function MotifSvg({
  motif,
  tone,
  opacity,
}: {
  motif: Motif;
  tone: Tone;
  opacity: number;
}) {
  const s = strokeProps(tone, opacity);
  const sThin = strokeProps(tone, opacity, 1);

  if (motif === "flower") {
    return (
      <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
        <path
          {...s}
          d="M50 18c5 7 7 14 0 23-7-9-5-16 0-23Z"
        />
        <path
          {...s}
          d="M72 32c-2 8-7 14-16 12 9-1 14-7 16-12Z"
        />
        <path
          {...s}
          d="M68 60c-8 2-14 7-12 16 1-9 7-14 12-16Z"
        />
        <path
          {...s}
          d="M32 60c5 2 11 7 12 16-1-9-7-14-12-16Z"
        />
        <path
          {...s}
          d="M28 32c2 5 7 11 16 12-9 1-14-4-16-12Z"
        />
        <circle {...s} cx="50" cy="48" r="6.5" />
        <circle {...sThin} cx="50" cy="48" r="2.2" />
      </svg>
    );
  }

  if (motif === "sprig") {
    return (
      <svg viewBox="0 0 90 150" className="h-full w-full" aria-hidden>
        <path {...s} d="M42 142C40 112 46 84 52 54 56 36 64 20 74 8" />
        <path {...s} d="M50 66c-12-2-21 5-24 15 9-3 19-2 24-7Z" />
        <path {...s} d="M54 48c-10-5-14-16-10-25 3 11 8 18 10 25Z" />
        <path {...s} d="M56 88c12-3 19 4 21 14-10-2-19 0-21-5Z" />
        <path {...s} d="M46 110c-10 2-17 10-15 21 7-5 14-9 15-14Z" />
        <path {...s} d="M60 30c9-7 11-18 5-27 0 11-2 20-5 27Z" />
        <path {...s} d="M74 8c3 2 7 5 5 11-3-2-7-4-9-7 2-2 3-3 4-4Z" />
      </svg>
    );
  }

  if (motif === "arc") {
    return (
      <svg viewBox="0 0 150 150" className="h-full w-full" aria-hidden>
        <path
          {...s}
          d="M28 104C20 84 22 56 40 36c18-20 48-24 70-12 22 12 36 42 30 70-4 18-16 32-32 40"
        />
        <path {...s} d="M92 30c7-13 5-26-4-35 2 13 0 24 4 35Z" />
        <path {...s} d="M112 44c13-5 24-1 31 10-11-2-22 0-31 3Z" />
        <path {...s} d="M120 72c11 7 13 20 5 31-1-11-7-20-12-25Z" />
        <path {...sThin} d="M100 48c9 5 16 16 14 28" />
      </svg>
    );
  }

  // branch
  return (
    <svg viewBox="0 0 180 220" className="h-full w-full" aria-hidden>
      <path
        {...s}
        d="M36 204C42 166 52 128 70 98c18-28 42-48 70-62 14-7 28-13 38-18"
      />
      <path {...s} d="M64 138c-16-3-28 7-32 21 12-5 25-3 32-9Z" />
      <path {...s} d="M78 110c-14-9-19-25-12-39 5 16 10 28 12 39Z" />
      <path {...s} d="M96 86c14-7 23 2 27 16-12 0-23 2-27-4Z" />
      <path {...s} d="M52 164c-12 3-19 16-16 28 9-7 16-12 16-19Z" />
      <path {...s} d="M114 64c-10-12-9-28 2-39-2 14 2 26 7 35Z" />
      <path {...s} d="M134 48c11-9 12-23 5-34 2 12 0 23-5 34Z" />
      <path {...s} d="M104 80c5-2 11 0 12 5-5 0-10 2-14 0 1-2 1-4 2-5Z" />
      {/* Flor no extremo */}
      <g transform="translate(148 22)">
        <path {...s} d="M0-12c3 4 4 8 0 13-4-5-3-9 0-13Z" />
        <path {...s} d="M10-5c-1 5-4 8-9 7 5-1 8-4 9-7Z" />
        <path {...s} d="M7 8c-5 1-8 4-7 9 1-5 4-8 7-9Z" />
        <path {...s} d="M-7 8c3 1 6 4 7 9-1-5-4-8-7-9Z" />
        <path {...s} d="M-10-5c1 3 4 6 9 7-5 1-8-2-9-7Z" />
        <circle {...s} cx="0" cy="0" r="3.8" />
      </g>
    </svg>
  );
}

/**
 * Camada decorativa de line art floral (marca d'água).
 * Parallax sutil ao cursor em desktop; oculto no mobile.
 */
export function FloralBackground({
  className,
  items,
  variant = "section",
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const depthsRef = useRef<number[]>([]);
  const motifs = items ?? PRESETS[variant];

  useEffect(() => {
    depthsRef.current = motifs.map((m) => m.depth ?? 0.5);
  }, [motifs]);

  useEffect(() => {
    if (!rootRef.current) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointerQuery = window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    );

    let rafId = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let listening = false;

    function canParallax() {
      return !motionQuery.matches && pointerQuery.matches;
    }

    function applyTransforms(x: number, y: number) {
      layerRefs.current.forEach((el, i) => {
        if (!el) return;
        const depth = depthsRef.current[i] ?? 0.5;
        const tx = -x * MAX_SHIFT * depth;
        const ty = -y * MAX_SHIFT * depth;
        el.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`;
      });
    }

    function tick() {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;
      applyTransforms(currentX, currentY);

      if (
        Math.abs(targetX - currentX) > 0.001 ||
        Math.abs(targetY - currentY) > 0.001
      ) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = 0;
        currentX = targetX;
        currentY = targetY;
        applyTransforms(currentX, currentY);
      }
    }

    function onMove(e: MouseEvent) {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      targetX = Math.max(-1, Math.min(1, (e.clientX - cx) / cx));
      targetY = Math.max(-1, Math.min(1, (e.clientY - cy) / cy));
      if (!rafId) rafId = requestAnimationFrame(tick);
    }

    function enable() {
      if (!canParallax() || listening) return;
      listening = true;
      window.addEventListener("mousemove", onMove, { passive: true });
    }

    function disable() {
      if (listening) {
        window.removeEventListener("mousemove", onMove);
        listening = false;
      }
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      targetX = 0;
      targetY = 0;
      currentX = 0;
      currentY = 0;
      applyTransforms(0, 0);
    }

    function onMediaChange() {
      if (canParallax()) enable();
      else disable();
    }

    if (canParallax()) enable();
    motionQuery.addEventListener("change", onMediaChange);
    pointerQuery.addEventListener("change", onMediaChange);

    return () => {
      disable();
      motionQuery.removeEventListener("change", onMediaChange);
      pointerQuery.removeEventListener("change", onMediaChange);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={cn(
        "pointer-events-none absolute inset-0 z-0 overflow-hidden",
        "hidden lg:block",
        className
      )}
      aria-hidden
    >
      {motifs.map((item, i) => {
        const size = item.size ?? 200;
        const tone = item.tone ?? "rose-gold";
        const opacity = item.opacity ?? 0.12;
        const scaleX = item.flipX ? -1 : 1;
        const scaleY = item.flipY ? -1 : 1;
        const rotate = item.rotate ?? 0;

        return (
          <div
            key={`${item.motif}-${item.position}-${i}`}
            className={cn(
              "absolute",
              ANCHOR_CLASS[item.position],
              item.className
            )}
            style={{ width: size, height: size }}
          >
            {/* Camada só de parallax — não mistura com o translate de âncora */}
            <div
              ref={(el) => {
                layerRefs.current[i] = el;
              }}
              className="h-full w-full will-change-transform"
            >
              <div
                className="h-full w-full"
                style={{
                  transform: `scale(${scaleX}, ${scaleY}) rotate(${rotate}deg)`,
                  transformOrigin: "center",
                }}
              >
                <MotifSvg motif={item.motif} tone={tone} opacity={opacity} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
