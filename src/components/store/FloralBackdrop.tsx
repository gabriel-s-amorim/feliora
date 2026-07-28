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

/**
 * Poucos motivos nas bordas — centro livre para título/produtos.
 * Opacidade baixa: presente, sem competir com o conteúdo.
 */
const MOTIFS: Motif[] = [
  {
    Motif: FloralRose,
    shell:
      "left-[-12%] top-[2%] h-[min(48vh,380px)] w-[min(42vw,300px)] text-rose-gold opacity-[0.09] sm:opacity-[0.11]",
    anim: "floral-drift-a",
  },
  {
    Motif: FloralVine,
    shell:
      "right-[-10%] top-[0%] h-[min(52vh,400px)] w-[min(34vw,260px)] text-rose-gold opacity-[0.08] sm:opacity-[0.1]",
    anim: "floral-drift-b",
  },
  {
    Motif: FloralSpray,
    shell:
      "left-[-6%] bottom-[4%] h-[min(40vh,320px)] w-[min(38vw,280px)] text-blush opacity-[0.09] sm:opacity-[0.11]",
    anim: "floral-drift-c",
  },
  {
    Motif: FloralRose,
    shell:
      "right-[-8%] bottom-[0%] h-[min(38vh,300px)] w-[min(34vw,250px)] rotate-180 text-rose-gold-light opacity-[0.08] sm:opacity-[0.1]",
    anim: "floral-breathe",
  },
  {
    Motif: FloralVine,
    shell:
      "left-[8%] top-[42%] hidden h-[210px] w-[150px] rotate-[20deg] text-rose-gold opacity-[0.06] lg:block",
    anim: "floral-breathe-slow",
  },
  {
    Motif: FloralSpray,
    shell:
      "right-[6%] top-[48%] hidden h-[190px] w-[160px] -rotate-[16deg] text-blush opacity-[0.06] lg:block",
    anim: "floral-drift-a",
  },
];

/**
 * Fundo botânico estilo tatuagem — sutil, só nas margens, movimento lento.
 */
export function FloralBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_12%_8%,rgba(183,110,121,0.05),transparent_42%),radial-gradient(ellipse_at_90%_88%,rgba(201,160,122,0.06),transparent_45%)]" />

      {MOTIFS.map(({ Motif, shell, anim }, i) => (
        <div key={i} className={cn("absolute", shell)}>
          <Motif className={cn("h-full w-full will-change-transform", anim)} />
        </div>
      ))}

      <span className="floral-petal absolute left-[8%] top-[30%] h-1 w-1 rounded-full bg-rose-gold/25" />
      <span className="floral-petal-delay absolute right-[10%] top-[40%] h-1 w-1 rounded-full bg-blush/30" />
      <span className="floral-petal-slow absolute left-[78%] bottom-[22%] h-1 w-1 rounded-full bg-rose-gold-light/25" />
    </div>
  );
}
