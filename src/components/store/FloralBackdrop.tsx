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
 * Acentos em pontos da tela (cantos + laterais) — centro livre.
 * Alguns mais presentes, outros mais leves.
 */
const MOTIFS: Motif[] = [
  {
    Motif: FloralRose,
    shell:
      "left-[-11%] top-[0%] h-[min(50vh,400px)] w-[min(44vw,320px)] text-rose-gold opacity-[0.16] sm:opacity-[0.19]",
    anim: "floral-drift-a",
  },
  {
    Motif: FloralVine,
    shell:
      "right-[-9%] top-[-2%] h-[min(54vh,420px)] w-[min(36vw,280px)] text-rose-gold opacity-[0.15] sm:opacity-[0.18]",
    anim: "floral-drift-b",
  },
  {
    Motif: FloralSpray,
    shell:
      "left-[-5%] bottom-[2%] h-[min(42vh,340px)] w-[min(40vw,300px)] text-blush opacity-[0.15] sm:opacity-[0.18]",
    anim: "floral-drift-c",
  },
  {
    Motif: FloralRose,
    shell:
      "right-[-7%] bottom-[-2%] h-[min(40vh,320px)] w-[min(36vw,270px)] rotate-180 text-rose-gold-light opacity-[0.14] sm:opacity-[0.17]",
    anim: "floral-breathe",
  },
  {
    Motif: FloralVine,
    shell:
      "left-[4%] top-[38%] h-[min(28vh,240px)] w-[min(22vw,170px)] rotate-[18deg] text-rose-gold opacity-[0.1] sm:opacity-[0.12]",
    anim: "floral-breathe-slow",
  },
  {
    Motif: FloralSpray,
    shell:
      "right-[3%] top-[44%] h-[min(26vh,220px)] w-[min(22vw,180px)] -rotate-[14deg] text-blush opacity-[0.09] sm:opacity-[0.11]",
    anim: "floral-drift-a",
  },
  {
    Motif: FloralRose,
    shell:
      "left-[12%] top-[68%] hidden h-[160px] w-[130px] -rotate-12 text-rose-gold-light opacity-[0.08] md:block",
    anim: "floral-drift-c",
  },
  {
    Motif: FloralVine,
    shell:
      "right-[10%] top-[22%] hidden h-[170px] w-[120px] rotate-[155deg] text-rose-gold opacity-[0.08] md:block",
    anim: "floral-breathe-slow",
  },
];

/**
 * Fundo botânico estilo tatuagem — acentos pontuais, contraste de traço, elegante.
 */
export function FloralBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_8%_6%,rgba(183,110,121,0.07),transparent_38%),radial-gradient(ellipse_at_94%_92%,rgba(201,160,122,0.07),transparent_40%)]" />

      {MOTIFS.map(({ Motif, shell, anim }, i) => (
        <div key={i} className={cn("absolute", shell)}>
          <Motif className={cn("h-full w-full will-change-transform", anim)} />
        </div>
      ))}

      <span className="floral-petal absolute left-[7%] top-[28%] h-1.5 w-1.5 rounded-full bg-rose-gold/35" />
      <span className="floral-petal-delay absolute right-[9%] top-[38%] h-1 w-1 rounded-full bg-blush/40" />
      <span className="floral-petal-slow absolute left-[82%] bottom-[20%] h-1.5 w-1.5 rounded-full bg-rose-gold-light/30" />
    </div>
  );
}
