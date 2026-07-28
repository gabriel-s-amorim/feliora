import { cn } from "@/lib/utils";
import {
  FloralBloom,
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
 * Acentos em pontos da tela — centro relativamente livre.
 * Cantos mais presentes; laterais e miolos menores mais leves.
 */
const MOTIFS: Motif[] = [
  {
    Motif: FloralRose,
    shell:
      "left-[-10%] top-[-2%] h-[min(52vh,420px)] w-[min(46vw,340px)] text-rose-gold opacity-[0.22] sm:opacity-[0.26]",
    anim: "floral-drift-a",
  },
  {
    Motif: FloralVine,
    shell:
      "right-[-8%] top-[-4%] h-[min(56vh,440px)] w-[min(38vw,300px)] text-rose-gold opacity-[0.2] sm:opacity-[0.24]",
    anim: "floral-drift-b",
  },
  {
    Motif: FloralSpray,
    shell:
      "left-[-4%] bottom-[0%] h-[min(44vh,360px)] w-[min(42vw,320px)] text-blush opacity-[0.2] sm:opacity-[0.24]",
    anim: "floral-drift-c",
  },
  {
    Motif: FloralRose,
    shell:
      "right-[-6%] bottom-[-4%] h-[min(42vh,340px)] w-[min(38vw,290px)] rotate-180 text-rose-gold-light opacity-[0.19] sm:opacity-[0.23]",
    anim: "floral-breathe",
  },
  {
    Motif: FloralBloom,
    shell:
      "left-[2%] top-[32%] h-[min(30vh,260px)] w-[min(24vw,200px)] rotate-[12deg] text-rose-gold opacity-[0.16] sm:opacity-[0.19]",
    anim: "floral-breathe-slow",
  },
  {
    Motif: FloralBloom,
    shell:
      "right-[1%] top-[36%] h-[min(28vh,240px)] w-[min(22vw,190px)] -rotate-[18deg] text-blush opacity-[0.15] sm:opacity-[0.18]",
    anim: "floral-drift-a",
  },
  {
    Motif: FloralVine,
    shell:
      "left-[6%] top-[58%] h-[min(32vh,270px)] w-[min(24vw,180px)] rotate-[22deg] text-rose-gold-light opacity-[0.14] sm:opacity-[0.17]",
    anim: "floral-drift-c",
  },
  {
    Motif: FloralSpray,
    shell:
      "right-[5%] top-[58%] h-[min(30vh,250px)] w-[min(26vw,200px)] -rotate-[10deg] text-blush opacity-[0.13] sm:opacity-[0.16]",
    anim: "floral-breathe",
  },
  {
    Motif: FloralBloom,
    shell:
      "left-[18%] top-[72%] h-[150px] w-[120px] -rotate-8 text-rose-gold opacity-[0.12] sm:opacity-[0.14]",
    anim: "floral-drift-b",
  },
  {
    Motif: FloralRose,
    shell:
      "right-[16%] top-[18%] hidden h-[180px] w-[145px] rotate-[8deg] text-rose-gold opacity-[0.11] md:block",
    anim: "floral-breathe-slow",
  },
  {
    Motif: FloralVine,
    shell:
      "left-[20%] top-[14%] hidden h-[190px] w-[135px] rotate-[160deg] text-blush opacity-[0.1] md:block",
    anim: "floral-drift-a",
  },
  {
    Motif: FloralBloom,
    shell:
      "right-[20%] bottom-[16%] hidden h-[140px] w-[115px] rotate-[150deg] text-rose-gold-light opacity-[0.11] md:block",
    anim: "floral-drift-c",
  },
];

/**
 * Fundo botânico estilo tatuagem — mais presença, traço forte + fino, só em zonas.
 */
export function FloralBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_6%_4%,rgba(183,110,121,0.09),transparent_36%),radial-gradient(ellipse_at_96%_94%,rgba(201,160,122,0.09),transparent_38%)]" />

      {MOTIFS.map(({ Motif, shell, anim }, i) => (
        <div key={i} className={cn("absolute", shell)}>
          <Motif className={cn("h-full w-full will-change-transform", anim)} />
        </div>
      ))}

      <span className="floral-petal absolute left-[7%] top-[26%] h-1.5 w-1.5 rounded-full bg-rose-gold/40" />
      <span className="floral-petal-delay absolute right-[8%] top-[34%] h-1.5 w-1.5 rounded-full bg-blush/45" />
      <span className="floral-petal-slow absolute left-[80%] bottom-[18%] h-1.5 w-1.5 rounded-full bg-rose-gold-light/35" />
      <span className="floral-petal absolute left-[24%] top-[48%] h-1 w-1 rounded-full bg-rose-gold/30" />
    </div>
  );
}
