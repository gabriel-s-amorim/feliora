"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Side = "left" | "right";
type Motif = "bloom" | "sprig";
type Tone = "rose-gold" | "earth";

export type FloralPlacement = {
  side: Side;
  motif: Motif;
  depth?: number;
  tone?: Tone;
  opacity?: number;
  size?: number;
  /** Rotação extra em graus */
  rotate?: number;
  className?: string;
};

type Props = {
  className?: string;
  placements?: FloralPlacement[];
  variant?: "store" | "corners";
};

/**
 * Dois motivos distintos, peso visual parecido — sem espelhamento.
 * bloom = flor em evidência; sprig = ramo com folhas + botão.
 */
const PRESETS: Record<NonNullable<Props["variant"]>, FloralPlacement[]> = {
  store: [
    {
      side: "left",
      motif: "bloom",
      size: 300,
      depth: 0.45,
      tone: "rose-gold",
      opacity: 0.14,
      rotate: -8,
    },
    {
      side: "right",
      motif: "sprig",
      size: 290,
      depth: 0.5,
      tone: "rose-gold",
      opacity: 0.14,
      rotate: 6,
    },
  ],
  corners: [
    {
      side: "left",
      motif: "bloom",
      size: 240,
      depth: 0.35,
      opacity: 0.12,
      rotate: -12,
    },
    {
      side: "right",
      motif: "sprig",
      size: 240,
      depth: 0.4,
      opacity: 0.12,
      rotate: 10,
    },
  ],
};

const SIDE_CLASS: Record<Side, string> = {
  left: "left-0 top-[18%] -translate-x-[18%]",
  right: "right-0 top-[42%] translate-x-[18%]",
};

const TONE_VAR: Record<Tone, string> = {
  "rose-gold": "var(--color-rose-gold)",
  earth: "var(--color-earth)",
};

const MAX_SHIFT = 10;

function stroke(tone: Tone, opacity: number, width = 1.3) {
  return {
    fill: "none" as const,
    stroke: TONE_VAR[tone],
    strokeWidth: width,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    opacity,
  };
}

/** Flor de 5 pétalas arredondadas — família da logo Feliora */
function Flower({
  cx,
  cy,
  r = 1,
  tone,
  opacity,
}: {
  cx: number;
  cy: number;
  r?: number;
  tone: Tone;
  opacity: number;
}) {
  const s = stroke(tone, opacity, 1.25 * r);
  const sThin = stroke(tone, opacity, 0.9 * r);

  return (
    <g transform={`translate(${cx} ${cy}) scale(${r})`}>
      <circle {...s} cx="0" cy="0" r="7.5" />
      <circle {...sThin} cx="0" cy="0" r="2.5" />

      {/* Pétalas: base no anel, ponta arredondada */}
      <path
        {...s}
        d="M-3.2 -6.8 C-9 -14 -7 -28 0 -34 C7 -28 9 -14 3.2 -6.8"
      />
      <path {...sThin} d="M0 -8 L0 -30" />

      <path
        {...s}
        d="M5.5 -4.5 C14 -11 28 -8 34 0 C28 6 16 5 6.5 -2.5"
      />
      <path {...sThin} d="M7 -3.5 L28 -2" />

      <path
        {...s}
        d="M5.5 4.5 C13 11 22 26 14 35 C6 36 1.5 24 3.5 8"
      />
      <path {...sThin} d="M5.5 6.5 L13 30" />

      <path
        {...s}
        d="M-5.5 4.5 C-13 11 -22 26 -14 35 C-6 36 -1.5 24 -3.5 8"
      />
      <path {...sThin} d="M-5.5 6.5 L-13 30" />

      <path
        {...s}
        d="M-5.5 -4.5 C-14 -11 -28 -8 -34 0 C-28 6 -16 5 -6.5 -2.5"
      />
      <path {...sThin} d="M-7 -3.5 L-28 -2" />
    </g>
  );
}

/**
 * bloom — caule curto, flor grande, 2–3 folhas. Sem sobreposições.
 */
function BloomSvg({ tone, opacity }: { tone: Tone; opacity: number }) {
  const s = stroke(tone, opacity);
  const sThin = stroke(tone, opacity, 1);

  return (
    <svg viewBox="0 0 180 260" className="h-full w-full" aria-hidden>
      <path
        {...s}
        strokeWidth={1.4}
        d="M118 248 C112 200 98 160 72 128 C58 112 44 100 34 90"
      />

      <path
        {...s}
        d="M108 210 C128 200 144 176 142 150 C128 174 116 196 108 210"
      />
      <path {...sThin} d="M108 210 L134 164" />

      <path
        {...s}
        d="M88 160 C68 150 52 128 52 102 C64 126 78 148 88 160"
      />
      <path {...sThin} d="M88 160 L58 118" />

      <path {...s} d="M72 128 C56 112 42 98 30 86" />

      <Flower cx={22} cy={68} r={1} tone={tone} opacity={opacity} />
    </svg>
  );
}

/**
 * sprig — ramo alongado com folhas + flor lateral + botão.
 * Silhueta diferente do bloom (não é espelho).
 */
function SprigSvg({ tone, opacity }: { tone: Tone; opacity: number }) {
  const s = stroke(tone, opacity);
  const sThin = stroke(tone, opacity, 1);

  return (
    <svg viewBox="0 0 180 280" className="h-full w-full" aria-hidden>
      <path
        {...s}
        strokeWidth={1.4}
        d="M36 268
           C44 220 66 190 90 158
           C112 128 126 100 128 68
           C130 46 122 30 110 18"
      />

      <path
        {...s}
        d="M42 240 C26 230 14 208 16 182 C28 206 36 228 42 240"
      />
      <path {...sThin} d="M42 240 L22 198" />

      <path
        {...s}
        d="M70 188 C90 176 106 152 104 124 C90 150 78 172 70 188"
      />
      <path {...sThin} d="M70 188 L98 140" />

      <path
        {...s}
        d="M116 96 C100 86 88 64 90 42 C100 64 110 84 116 96"
      />
      <path {...sThin} d="M116 96 L96 56" />

      <path {...s} d="M90 158 C78 148 64 138 52 130" />

      <Flower cx={42} cy={120} r={0.72} tone={tone} opacity={opacity} />

      <path
        {...s}
        d="M110 18 C118 10 126 2 124 -8 C118 2 112 12 108 18"
      />
      <path {...sThin} d="M110 18 L122 -2" />
    </svg>
  );
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
  if (motif === "bloom") return <BloomSvg tone={tone} opacity={opacity} />;
  return <SprigSvg tone={tone} opacity={opacity} />;
}

/**
 * Camada floral decorativa — um motivo coeso por lateral (sem espelho).
 * Desktop only; parallax sutil.
 */
export function FloralBackground({
  className,
  placements,
  variant = "store",
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const depthsRef = useRef<number[]>([]);
  const items = placements ?? PRESETS[variant];

  useEffect(() => {
    depthsRef.current = items.map((m) => m.depth ?? 0.5);
  }, [items]);

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
        el.style.transform = `translate3d(${(-x * MAX_SHIFT * depth).toFixed(2)}px, ${(-y * MAX_SHIFT * depth).toFixed(2)}px, 0)`;
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
        applyTransforms(targetX, targetY);
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
        "pointer-events-none fixed inset-0 z-[2] overflow-hidden",
        "hidden lg:block",
        className
      )}
      aria-hidden
    >
      {items.map((item, i) => {
        const size = item.size ?? 280;
        const tone = item.tone ?? "rose-gold";
        const opacity = item.opacity ?? 0.14;
        const rotate = item.rotate ?? 0;
        const aspect = item.motif === "bloom" ? 260 / 180 : 280 / 180;

        return (
          <div
            key={`${item.side}-${item.motif}-${i}`}
            className={cn("absolute", SIDE_CLASS[item.side], item.className)}
            style={{ width: size, height: size * aspect }}
          >
            <div
              ref={(el) => {
                layerRefs.current[i] = el;
              }}
              className="h-full w-full will-change-transform"
            >
              <div
                className="h-full w-full"
                style={{
                  transform: `rotate(${rotate}deg)`,
                  transformOrigin: "center",
                }}
              >
                <MotifSvg
                  motif={item.motif}
                  tone={tone}
                  opacity={opacity}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
