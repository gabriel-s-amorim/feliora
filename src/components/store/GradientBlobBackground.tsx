import { cn } from "@/lib/utils";

type BlobTone = "rose-blush" | "blush-cream" | "earth-blush" | "rose-cream";
type BlobAnchor =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "mid-left"
  | "mid-right";

export type GradientBlob = {
  tone?: BlobTone;
  position: BlobAnchor;
  /** Diâmetro aproximado em px */
  size?: number;
  /** Blur em px (80–120) */
  blur?: number;
  /** Opacidade do blob 0–1 */
  opacity?: number;
  /** Delay da animação, ex: "0s" | "4s" */
  delay?: string;
  /** Duração da animação */
  duration?: string;
  className?: string;
};

type Props = {
  className?: string;
  blobs?: GradientBlob[];
  /** featured = laterais da seção Em destaque */
  variant?: "featured" | "ambient";
};

const TONES: Record<BlobTone, [string, string]> = {
  "rose-blush": ["var(--color-rose-gold)", "var(--color-blush)"],
  "blush-cream": ["var(--color-blush)", "var(--color-cream)"],
  "earth-blush": ["var(--color-earth)", "var(--color-blush)"],
  "rose-cream": ["var(--color-rose-gold)", "var(--color-ivory)"],
};

const ANCHOR: Record<BlobAnchor, string> = {
  "top-left": "left-0 top-0 -translate-x-1/3 -translate-y-1/4",
  "top-right": "right-0 top-0 translate-x-1/3 -translate-y-1/4",
  "bottom-left": "bottom-0 left-0 -translate-x-1/3 translate-y-1/4",
  "bottom-right": "bottom-0 right-0 translate-x-1/3 translate-y-1/4",
  "mid-left": "left-0 top-1/2 -translate-x-[40%] -translate-y-1/2",
  "mid-right": "right-0 top-1/2 translate-x-[40%] -translate-y-1/2",
};

const ORGANIC_RADIUS = [
  "42% 58% 65% 35% / 45% 40% 60% 55%",
  "60% 40% 30% 70% / 55% 65% 35% 45%",
  "35% 65% 50% 50% / 60% 30% 70% 40%",
] as const;

const PRESETS: Record<NonNullable<Props["variant"]>, GradientBlob[]> = {
  featured: [
    {
      position: "mid-left",
      tone: "rose-blush",
      size: 420,
      blur: 100,
      opacity: 0.2,
      delay: "0s",
      duration: "18s",
    },
    {
      position: "top-right",
      tone: "blush-cream",
      size: 360,
      blur: 90,
      opacity: 0.22,
      delay: "3s",
      duration: "22s",
    },
    {
      position: "bottom-right",
      tone: "earth-blush",
      size: 320,
      blur: 110,
      opacity: 0.16,
      delay: "7s",
      duration: "20s",
    },
  ],
  ambient: [
    {
      position: "top-left",
      tone: "blush-cream",
      size: 380,
      blur: 100,
      opacity: 0.18,
      delay: "0s",
      duration: "20s",
    },
    {
      position: "bottom-right",
      tone: "rose-blush",
      size: 400,
      blur: 110,
      opacity: 0.18,
      delay: "5s",
      duration: "24s",
    },
  ],
};

/**
 * Luz colorida difusa nas laterais — só CSS, sem ilustração.
 */
export function GradientBlobBackground({
  className,
  blobs,
  variant = "featured",
}: Props) {
  const items = blobs ?? PRESETS[variant];

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-0 overflow-hidden",
        className
      )}
      aria-hidden
    >
      {items.map((blob, i) => {
        const [from, to] = TONES[blob.tone ?? "rose-blush"];
        const size = blob.size ?? 360;
        const blur = blob.blur ?? 100;
        const opacity = blob.opacity ?? 0.2;
        const radius = ORGANIC_RADIUS[i % ORGANIC_RADIUS.length];

        return (
          <div
            key={`${blob.position}-${i}`}
            className={cn("absolute", ANCHOR[blob.position], blob.className)}
            style={{ width: size, height: size }}
          >
            {/* Camada interna: animação não sobrescreve o translate de âncora */}
            <div
              className="gradient-blob h-full w-full"
              style={{
                borderRadius: radius,
                opacity,
                filter: `blur(${blur}px)`,
                background: `radial-gradient(ellipse at 35% 40%, ${from} 0%, ${to} 55%, transparent 75%)`,
                animationDelay: blob.delay ?? "0s",
                animationDuration: blob.duration ?? "20s",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
