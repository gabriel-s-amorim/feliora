import { cn } from "@/lib/utils";
import {
  FloralRose,
  FloralSpray,
  FloralVine,
} from "@/components/store/FloralMotifs";

type Motif = {
  Motif: typeof FloralRose;
  shell: string;
  anim: string;
};

const MOTIFS: Motif[] = [
  {
    Motif: FloralRose,
    shell:
      "left-[-8%] top-[4%] h-[min(42vh,340px)] w-[min(36vw,280px)] text-rose-gold opacity-[0.1] sm:opacity-[0.125]",
    anim: "floral-drift-a",
  },
  {
    Motif: FloralVine,
    shell:
      "right-[-6%] top-[2%] h-[min(48vh,380px)] w-[min(30vw,240px)] text-rose-gold opacity-[0.09] sm:opacity-[0.11]",
    anim: "floral-drift-b",
  },
  {
    Motif: FloralSpray,
    shell:
      "left-[-2%] bottom-[8%] h-[min(36vh,300px)] w-[min(34vw,260px)] text-blush opacity-[0.11] sm:opacity-[0.14]",
    anim: "floral-drift-c",
  },
  {
    Motif: FloralRose,
    shell:
      "right-[-2%] bottom-[2%] h-[min(32vh,260px)] w-[min(28vw,210px)] rotate-180 text-rose-gold-light opacity-[0.09] sm:right-[4%] sm:opacity-[0.11]",
    anim: "floral-breathe",
  },
  {
    Motif: FloralVine,
    shell:
      "left-[36%] top-[38%] hidden h-[200px] w-[140px] rotate-[28deg] text-rose-gold opacity-[0.055] lg:block",
    anim: "floral-drift-a",
  },
  {
    Motif: FloralSpray,
    shell:
      "right-[24%] top-[18%] hidden h-[180px] w-[150px] -rotate-[14deg] text-blush opacity-[0.07] md:block",
    anim: "floral-drift-b",
  },
  {
    Motif: FloralRose,
    shell:
      "left-[14%] top-[58%] h-[150px] w-[120px] -rotate-6 text-rose-gold opacity-[0.06] sm:opacity-[0.08]",
    anim: "floral-breathe-slow",
  },
  {
    Motif: FloralVine,
    shell:
      "right-[12%] top-[52%] h-[210px] w-[150px] rotate-[155deg] text-rose-gold-light opacity-[0.07] sm:opacity-[0.09]",
    anim: "floral-drift-c",
  },
];

/**
 * Fundo botânico estilo tatuagem — traço fino, rose-gold, movimento lento.
 * Storefront only; pointer-events none.
 */
export function FloralBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_18%_8%,rgba(183,110,121,0.07),transparent_42%),radial-gradient(ellipse_at_88%_78%,rgba(201,160,122,0.08),transparent_48%),radial-gradient(ellipse_at_50%_45%,rgba(253,248,244,0.35),transparent_65%)]" />

      {MOTIFS.map(({ Motif, shell, anim }, i) => (
        <div key={i} className={cn("absolute", shell)}>
          <Motif className={cn("h-full w-full will-change-transform", anim)} />
        </div>
      ))}

      <span className="floral-petal absolute left-[12%] top-[28%] h-1.5 w-1.5 rounded-full bg-rose-gold/30" />
      <span className="floral-petal-delay absolute right-[18%] top-[36%] h-1 w-1 rounded-full bg-blush/45" />
      <span className="floral-petal-slow absolute left-[55%] top-[70%] h-1.5 w-1.5 rounded-full bg-rose-gold-light/35" />
      <span className="floral-petal absolute right-[40%] top-[18%] h-1 w-1 rounded-full bg-rose-gold/25" />
      <span className="floral-petal-delay absolute left-[72%] bottom-[28%] h-1 w-1 rounded-full bg-blush/35" />
    </div>
  );
}
