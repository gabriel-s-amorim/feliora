"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Side = "left" | "right";
type Tone = "rose-gold" | "earth";

export type FloralPlacement = {
  side: Side;
  /** Multiplicador de parallax (0–1) */
  depth?: number;
  tone?: Tone;
  /** Opacidade 0–1 */
  opacity?: number;
  /** Largura em px */
  size?: number;
  className?: string;
};

type Props = {
  className?: string;
  /** Sobrescreve o par espelhado padrão */
  placements?: FloralPlacement[];
  /**
   * featured = um ramo por lateral (espelhado)
   * corners  = mesmo motivo, cantos superior esquerdo / direito
   */
  variant?: "featured" | "corners";
};

const PRESETS: Record<NonNullable<Props["variant"]>, FloralPlacement[]> = {
  featured: [
    { side: "left", depth: 0.55, tone: "rose-gold", opacity: 0.13, size: 340 },
    { side: "right", depth: 0.55, tone: "rose-gold", opacity: 0.13, size: 340 },
  ],
  corners: [
    { side: "left", depth: 0.4, tone: "rose-gold", opacity: 0.12, size: 260 },
    { side: "right", depth: 0.4, tone: "rose-gold", opacity: 0.12, size: 260 },
  ],
};

const SIDE_CLASS: Record<Side, string> = {
  left: "left-0 top-1/2 -translate-x-[28%] -translate-y-1/2",
  right: "right-0 top-1/2 translate-x-[28%] -translate-y-1/2",
};

const CORNER_CLASS: Record<Side, string> = {
  left: "left-0 top-8 -translate-x-[20%]",
  right: "right-0 top-8 translate-x-[20%]",
};

const TONE_VAR: Record<Tone, string> = {
  "rose-gold": "var(--color-rose-gold)",
  earth: "var(--color-earth)",
};

const MAX_SHIFT = 10;

/**
 * Ramo contínuo no espírito da logo Feliora:
 * um só caule → folhas que nascem nele → flor de 5 pétalas com nervuras → botão no ápice.
 *
 * Pontos de junção (sobre o caule):
 *  - Folha 1: (64, 378)
 *  - Folha 2: (74, 318)
 *  - Nó da flor + folha 3: (86, 262)
 *  - Folha 4: (140, 160)
 *  - Folha 5: (174, 68)
 *  - Botão: (164, 12)
 */
function FloralStemSvg({ tone, opacity }: { tone: Tone; opacity: number }) {
  const stroke = TONE_VAR[tone];
  const s = {
    fill: "none" as const,
    stroke,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    opacity,
  };

  return (
    <svg
      viewBox="0 0 220 440"
      className="h-full w-full"
      aria-hidden
      overflow="visible"
    >
      {/* Caule — passa exatamente pelos nós das folhas/flor */}
      <path
        {...s}
        strokeWidth={1.4}
        d="M62 420
           C63 400 63 388 64 378
           C68 350 72 330 74 318
           C78 292 82 274 86 262
           C100 220 122 186 140 160
           C156 136 168 104 174 68
           C178 42 172 24 164 12"
      />

      {/* Folha 1 — nasce em (64,378) */}
      <path
        {...s}
        strokeWidth={1.25}
        d="M64 378
           C44 370 24 346 22 318
           C40 344 54 366 64 378"
      />
      <path {...s} strokeWidth={1} d="M64 378 L34 332" />

      {/* Folha 2 — nasce em (74,318) */}
      <path
        {...s}
        strokeWidth={1.25}
        d="M74 318
           C96 308 118 282 122 252
           C106 280 88 304 74 318"
      />
      <path {...s} strokeWidth={1} d="M74 318 L114 264" />

      {/* Folha 3 — nasce no nó da flor (86,262), lado interno */}
      <path
        {...s}
        strokeWidth={1.25}
        d="M86 262
           C64 252 44 226 42 196
           C58 222 74 246 86 262"
      />
      <path {...s} strokeWidth={1} d="M86 262 L48 208" />

      {/* Haste floral: do nó (86,262) ao centro da flor (38,200) */}
      <path
        {...s}
        strokeWidth={1.3}
        d="M86 262 C68 240 50 218 38 200"
      />

      {/*
        Flor Feliora — 5 pétalas arredondadas partindo do anel central
        (não do ponto 0,0), com nervura interna. Menos “clipart”, mais logo.
      */}
      <g transform="translate(38 200)">
        {/* anel / miolo */}
        <circle {...s} strokeWidth={1.2} cx="0" cy="0" r="7" />
        <circle {...s} strokeWidth={0.85} cx="0" cy="0" r="2.4" />

        {/* pétala N */}
        <path
          {...s}
          strokeWidth={1.25}
          d="M-3.5 -6.2
             C-10 -14 -8 -28 0 -34
             C8 -28 10 -14 3.5 -6.2"
        />
        <path {...s} strokeWidth={0.9} d="M0 -7 L0 -30" />

        {/* pétala NE */}
        <path
          {...s}
          strokeWidth={1.25}
          d="M5.2 -4.5
             C14 -12 28 -10 34 -2
             C28 4 16 4 6.2 -2.5"
        />
        <path {...s} strokeWidth={0.9} d="M6 -3.5 L28 -4" />

        {/* pétala SE */}
        <path
          {...s}
          strokeWidth={1.25}
          d="M5.5 4
             C14 10 22 24 16 34
             C8 36 2 24 3.2 8"
        />
        <path {...s} strokeWidth={0.9} d="M5 6 L14 28" />

        {/* pétala SW */}
        <path
          {...s}
          strokeWidth={1.25}
          d="M-5.5 4
             C-14 10 -22 24 -16 34
             C-8 36 -2 24 -3.2 8"
        />
        <path {...s} strokeWidth={0.9} d="M-5 6 L-14 28" />

        {/* pétala NW */}
        <path
          {...s}
          strokeWidth={1.25}
          d="M-5.2 -4.5
             C-14 -12 -28 -10 -34 -2
             C-28 4 -16 4 -6.2 -2.5"
        />
        <path {...s} strokeWidth={0.9} d="M-6 -3.5 L-28 -4" />
      </g>

      {/* Folha 4 — nasce em (140,160) */}
      <path
        {...s}
        strokeWidth={1.25}
        d="M140 160
           C162 148 182 120 184 88
           C168 116 152 142 140 160"
      />
      <path {...s} strokeWidth={1} d="M140 160 L176 100" />

      {/* Folha 5 — nasce em (174,68) */}
      <path
        {...s}
        strokeWidth={1.2}
        d="M174 68
           C156 58 142 36 142 12
           C154 34 166 54 174 68"
      />
      <path {...s} strokeWidth={0.95} d="M174 68 L148 24" />

      {/* Botão no ápice (164,12) */}
      <path
        {...s}
        strokeWidth={1.25}
        d="M164 12
           C174 2 182 -4 180 -14
           C176 -4 170 4 164 12"
      />
      <path {...s} strokeWidth={0.95} d="M164 12 L176 -8" />
    </svg>
  );
}

/**
 * Camada decorativa floral (marca d'água).
 * Um ramo coeso por lado, espelhados. Desktop only + parallax sutil.
 */
export function FloralBackground({
  className,
  placements,
  variant = "featured",
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const depthsRef = useRef<number[]>([]);
  const items = placements ?? PRESETS[variant];
  const anchorClass = variant === "corners" ? CORNER_CLASS : SIDE_CLASS;

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
      {items.map((item, i) => {
        const size = item.size ?? 320;
        const tone = item.tone ?? "rose-gold";
        const opacity = item.opacity ?? 0.13;
        const mirrored = item.side === "right";

        return (
          <div
            key={`${item.side}-${i}`}
            className={cn("absolute", anchorClass[item.side], item.className)}
            style={{ width: size, height: size * (440 / 220) }}
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
                  transform: mirrored ? "scaleX(-1)" : undefined,
                  transformOrigin: "center",
                }}
              >
                <FloralStemSvg tone={tone} opacity={opacity} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
