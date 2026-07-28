import { cn } from "@/lib/utils";

type BlobTone = "rose-blush" | "blush-warm" | "earth-rose" | "rose-soft";
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
  /** Blur em px */
  blur?: number;
  /** Intensidade 0–1 (misturada nas cores do gradiente) */
  intensity?: number;
  delay?: string;
  duration?: string;
  className?: string;
};

type Props = {
  className?: string;
  blobs?: GradientBlob[];
  variant?: "featured" | "ambient";
};

/** Pares de cor — ambos com pigmento; evita terminar em cream (= invisível) */
const TONES: Record<BlobTone, [string, string]> = {
  "rose-blush": ["var(--color-rose-gold)", "var(--color-blush)"],
  "blush-warm": ["var(--color-blush)", "var(--color-rose-gold-light)"],
  "earth-rose": ["var(--color-earth)", "var(--color-rose-gold)"],
  "rose-soft": ["var(--color-rose-gold-light)", "var(--color-blush)"],
};

const ANCHOR: Record<BlobAnchor, string> = {
  "top-left": "left-0 top-0 -translate-x-[15%] -translate-y-[10%]",
  "top-right": "right-0 top-0 translate-x-[15%] -translate-y-[10%]",
  "bottom-left": "bottom-0 left-0 -translate-x-[15%] translate-y-[10%]",
  "bottom-right": "bottom-0 right-0 translate-x-[15%] translate-y-[10%]",
  "mid-left": "left-0 top-1/2 -translate-x-[20%] -translate-y-1/2",
  "mid-right": "right-0 top-1/2 translate-x-[20%] -translate-y-1/2",
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
      size: 480,
      blur: 80,
      intensity: 0.45,
      delay: "0s",
      duration: "18s",
    },
    {
      position: "top-right",
      tone: "blush-warm",
      size: 420,
      blur: 75,
      intensity: 0.4,
      delay: "3s",
      duration: "22s",
    },
    {
      position: "bottom-right",
      tone: "earth-rose",
      size: 380,
      blur: 85,
      intensity: 0.35,
      delay: "7s",
      duration: "20s",
    },
  ],
  ambient: [
    {
      position: "top-left",
      tone: "blush-warm",
      size: 420,
      blur: 80,
      intensity: 0.38,
      delay: "0s",
      duration: "20s",
    },
    {
      position: "bottom-right",
      tone: "rose-blush",
      size: 440,
      blur: 85,
      intensity: 0.4,
      delay: "5s",
      duration: "24s",
    },
  ],
};

function blobBackground(from: string, to: string, intensity: number): string {
  const core = `color-mix(in srgb, ${from} ${Math.round(intensity * 100)}%, transparent)`;
  const mid = `color-mix(in srgb, ${to} ${Math.round(intensity * 70)}%, transparent)`;
  return `radial-gradient(ellipse at 40% 40%, ${core} 0%, ${mid} 42%, transparent 72%)`;
}

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
        const size = blob.size ?? 400;
        const blur = blob.blur ?? 80;
        const intensity = blob.intensity ?? 0.4;
        const radius = ORGANIC_RADIUS[i % ORGANIC_RADIUS.length];

        return (
          <div
            key={`${blob.position}-${i}`}
            className={cn("absolute", ANCHOR[blob.position], blob.className)}
            style={{ width: size, height: size }}
          >
            <div
              className="gradient-blob h-full w-full"
              style={{
                borderRadius: radius,
                filter: `blur(${blur}px)`,
                background: blobBackground(from, to, intensity),
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
