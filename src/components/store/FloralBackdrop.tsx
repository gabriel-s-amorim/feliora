import { cn } from "@/lib/utils";
import {
  FloralFieldTile,
  FloralRose,
  FloralSpray,
  FloralVine,
} from "@/components/store/FloralMotifs";

type Motif = {
  Motif: typeof FloralRose;
  shell: string;
  anim: string;
};

/** Motivos grandes — presença clara nas bordas e no meio */
const MOTIFS: Motif[] = [
  {
    Motif: FloralRose,
    shell:
      "left-[-10%] top-[-2%] h-[min(52vh,420px)] w-[min(48vw,340px)] text-rose-gold opacity-[0.28] sm:opacity-[0.32]",
    anim: "floral-drift-a",
  },
  {
    Motif: FloralVine,
    shell:
      "right-[-8%] top-[-4%] h-[min(58vh,460px)] w-[min(40vw,300px)] text-rose-gold opacity-[0.26] sm:opacity-[0.3]",
    anim: "floral-drift-b",
  },
  {
    Motif: FloralSpray,
    shell:
      "left-[-4%] top-[28%] h-[min(40vh,340px)] w-[min(42vw,300px)] text-blush opacity-[0.24] sm:opacity-[0.28]",
    anim: "floral-drift-c",
  },
  {
    Motif: FloralRose,
    shell:
      "right-[-6%] top-[30%] h-[min(38vh,320px)] w-[min(36vw,280px)] rotate-[12deg] text-rose-gold-light opacity-[0.24] sm:opacity-[0.28]",
    anim: "floral-breathe",
  },
  {
    Motif: FloralSpray,
    shell:
      "left-[-2%] bottom-[-2%] h-[min(44vh,380px)] w-[min(46vw,340px)] text-blush opacity-[0.26] sm:opacity-[0.3]",
    anim: "floral-drift-c",
  },
  {
    Motif: FloralRose,
    shell:
      "right-[-4%] bottom-[-4%] h-[min(42vh,360px)] w-[min(40vw,300px)] rotate-180 text-rose-gold opacity-[0.26] sm:opacity-[0.3]",
    anim: "floral-breathe",
  },
  {
    Motif: FloralVine,
    shell:
      "left-[22%] top-[8%] h-[min(34vh,280px)] w-[min(28vw,220px)] rotate-[18deg] text-rose-gold opacity-[0.18] sm:opacity-[0.22]",
    anim: "floral-drift-a",
  },
  {
    Motif: FloralSpray,
    shell:
      "right-[18%] top-[12%] h-[min(30vh,260px)] w-[min(26vw,210px)] -rotate-[20deg] text-blush opacity-[0.2] sm:opacity-[0.24]",
    anim: "floral-drift-b",
  },
  {
    Motif: FloralRose,
    shell:
      "left-[30%] top-[38%] h-[min(36vh,300px)] w-[min(32vw,250px)] -rotate-6 text-rose-gold opacity-[0.16] sm:opacity-[0.2]",
    anim: "floral-breathe-slow",
  },
  {
    Motif: FloralVine,
    shell:
      "right-[26%] top-[42%] h-[min(40vh,320px)] w-[min(28vw,230px)] rotate-[150deg] text-rose-gold-light opacity-[0.18] sm:opacity-[0.22]",
    anim: "floral-drift-c",
  },
  {
    Motif: FloralSpray,
    shell:
      "left-[18%] bottom-[18%] h-[min(32vh,270px)] w-[min(30vw,240px)] rotate-[8deg] text-blush opacity-[0.2] sm:opacity-[0.24]",
    anim: "floral-drift-a",
  },
  {
    Motif: FloralRose,
    shell:
      "right-[14%] bottom-[20%] h-[min(30vh,250px)] w-[min(26vw,210px)] rotate-[165deg] text-rose-gold opacity-[0.18] sm:opacity-[0.22]",
    anim: "floral-breathe-slow",
  },
  {
    Motif: FloralVine,
    shell:
      "left-[48%] top-[62%] h-[220px] w-[160px] -rotate-[30deg] text-rose-gold-light opacity-[0.16] sm:opacity-[0.2]",
    anim: "floral-drift-b",
  },
  {
    Motif: FloralSpray,
    shell:
      "left-[42%] top-[2%] h-[200px] w-[170px] rotate-[35deg] text-blush opacity-[0.15] sm:opacity-[0.19]",
    anim: "floral-drift-c",
  },
];

const FIELD_TILES = [
  { className: "left-0 top-0", anim: "floral-field-pan-a" },
  { className: "left-1/2 top-0 -translate-x-1/2", anim: "floral-field-pan-b" },
  { className: "right-0 top-0", anim: "floral-field-pan-c" },
  { className: "left-0 top-1/2 -translate-y-1/2", anim: "floral-field-pan-b" },
  { className: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2", anim: "floral-field-pan-a" },
  { className: "right-0 top-1/2 -translate-y-1/2", anim: "floral-field-pan-c" },
  { className: "left-0 bottom-0", anim: "floral-field-pan-c" },
  { className: "left-1/2 bottom-0 -translate-x-1/2", anim: "floral-field-pan-a" },
  { className: "right-0 bottom-0", anim: "floral-field-pan-b" },
] as const;

/**
 * Fundo botânico estilo tatuagem — denso, rose-gold, movimento lento.
 */
export function FloralBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      {/* Base tonal — menos “branco”, mais pele/creamy blush */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_10%,rgba(183,110,121,0.14),transparent_40%),radial-gradient(ellipse_at_85%_20%,rgba(212,165,154,0.12),transparent_42%),radial-gradient(ellipse_at_50%_55%,rgba(201,160,122,0.1),transparent_50%),radial-gradient(ellipse_at_80%_85%,rgba(183,110,121,0.12),transparent_45%),linear-gradient(165deg,#f7efe8_0%,#fdf8f4_40%,#f3e6dc_100%)]" />

      {/* Campo denso de flores miúdas — preenche o espaço vazio */}
      <div className="absolute inset-0 opacity-[0.2] text-rose-gold sm:opacity-[0.24]">
        {FIELD_TILES.map((tile, i) => (
          <div
            key={i}
            className={cn("absolute h-[50vmax] w-[50vmax]", tile.className)}
          >
            <FloralFieldTile
              className={cn("h-full w-full will-change-transform", tile.anim)}
            />
          </div>
        ))}
      </div>

      {/* Motivos grandes em primeiro plano do fundo */}
      {MOTIFS.map(({ Motif, shell, anim }, i) => (
        <div key={i} className={cn("absolute", shell)}>
          <Motif className={cn("h-full w-full will-change-transform", anim)} />
        </div>
      ))}

      {/* Pétalas */}
      <span className="floral-petal absolute left-[10%] top-[24%] h-2 w-2 rounded-full bg-rose-gold/45" />
      <span className="floral-petal-delay absolute right-[14%] top-[32%] h-1.5 w-1.5 rounded-full bg-blush/55" />
      <span className="floral-petal-slow absolute left-[52%] top-[66%] h-2 w-2 rounded-full bg-rose-gold-light/40" />
      <span className="floral-petal absolute right-[36%] top-[14%] h-1.5 w-1.5 rounded-full bg-rose-gold/40" />
      <span className="floral-petal-delay absolute left-[68%] bottom-[24%] h-1.5 w-1.5 rounded-full bg-blush/50" />
      <span className="floral-petal-slow absolute left-[28%] top-[48%] h-1 w-1 rounded-full bg-rose-gold/35" />
      <span className="floral-petal absolute right-[48%] bottom-[36%] h-1.5 w-1.5 rounded-full bg-blush/40" />
    </div>
  );
}
