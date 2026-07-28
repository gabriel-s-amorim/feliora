import { cn } from "@/lib/utils";

type Side = "left" | "right";

type Placement = {
  side: Side;
  motif: "vine" | "spray";
  size?: number;
  opacity?: number;
  rotate?: number;
  className?: string;
};

type Props = {
  className?: string;
  placements?: Placement[];
};

/**
 * Fine-line tattoo: um caule contínuo, folhas que nascem nele.
 * Sem flor solta, sem espelho — duas composições distintas.
 */
const DEFAULT: Placement[] = [
  {
    side: "left",
    motif: "vine",
    size: 340,
    opacity: 0.16,
    rotate: -6,
    className: "top-[12%] -translate-x-[12%]",
  },
  {
    side: "right",
    motif: "spray",
    size: 300,
    opacity: 0.15,
    rotate: 8,
    className: "bottom-[8%] translate-x-[10%]",
  },
];

const SIDE_POS: Record<Side, string> = {
  left: "left-0",
  right: "right-0",
};

function stroke(opacity: number, width = 1.35) {
  return {
    fill: "none" as const,
    stroke: "var(--color-rose-gold)",
    strokeWidth: width,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    opacity,
  };
}

/** Folha lanceolada — base no ponto do caule, limbo + nervura */
function Leaf({
  x,
  y,
  angle,
  length,
  sweep,
  opacity,
}: {
  x: number;
  y: number;
  angle: number;
  length: number;
  sweep: number;
  opacity: number;
}) {
  const s = stroke(opacity, 1.25);
  const sThin = stroke(opacity, 0.95);
  // Desenha no eixo local: base em 0,0, ponta em length
  const tip = length;
  const bulge = length * 0.28;

  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <path
        {...s}
        d={`M0 0
            C ${tip * 0.35} ${-sweep} ${tip * 0.7} ${-bulge} ${tip} 0
            C ${tip * 0.7} ${bulge} ${tip * 0.35} ${sweep} 0 0`}
      />
      <path {...sThin} d={`M0 0 L${tip * 0.85} 0`} />
    </g>
  );
}

/**
 * vine — galho longo vertical com folhas alternadas (estilo tatuagem fine-line)
 */
function VineSvg({ opacity }: { opacity: number }) {
  const s = stroke(opacity, 1.4);

  return (
    <svg viewBox="0 0 200 420" className="h-full w-full" aria-hidden>
      {/* Caule único — curva suave */}
      <path
        {...s}
        d="M78 410
           C82 350 88 300 96 255
           C106 200 122 155 138 115
           C150 85 158 55 160 28
           C161 14 158 6 152 0"
      />

      {/* Ramificação curta */}
      <path {...s} d="M96 255 C78 248 62 235 52 218" />

      <Leaf x={96} y={255} angle={-145} length={52} sweep={18} opacity={opacity} />
      <Leaf x={88} y={310} angle={35} length={58} sweep={20} opacity={opacity} />
      <Leaf x={100} y={215} angle={40} length={48} sweep={16} opacity={opacity} />
      <Leaf x={118} y={165} angle={-130} length={44} sweep={15} opacity={opacity} />
      <Leaf x={138} y={115} angle={45} length={50} sweep={17} opacity={opacity} />
      <Leaf x={152} y={68} angle={-125} length={38} sweep={13} opacity={opacity} />
      <Leaf x={52} y={218} angle={-160} length={36} sweep={12} opacity={opacity} />
      {/* Folha terminal no ápice */}
      <Leaf x={152} y={0} angle={-75} length={32} sweep={11} opacity={opacity} />
    </svg>
  );
}

/**
 * spray — ramo mais aberto, diagonal, peso visual parecido (não espelho)
 */
function SpraySvg({ opacity }: { opacity: number }) {
  const s = stroke(opacity, 1.4);

  return (
    <svg viewBox="0 0 240 360" className="h-full w-full" aria-hidden>
      <path
        {...s}
        d="M28 350
           C48 300 78 260 112 220
           C148 178 178 140 198 95
           C210 68 216 42 214 18
           C213 6 208 0 200 -4"
      />

      <path {...s} d="M112 220 C130 210 152 205 172 208" />
      <path {...s} d="M78 260 C58 250 42 230 36 208" />

      <Leaf x={48} y={300} angle={-150} length={48} sweep={16} opacity={opacity} />
      <Leaf x={78} y={260} angle={40} length={54} sweep={18} opacity={opacity} />
      <Leaf x={36} y={208} angle={-170} length={40} sweep={14} opacity={opacity} />
      <Leaf x={112} y={220} angle={-40} length={46} sweep={15} opacity={opacity} />
      <Leaf x={172} y={208} angle={15} length={42} sweep={14} opacity={opacity} />
      <Leaf x={148} y={178} angle={50} length={50} sweep={17} opacity={opacity} />
      <Leaf x={178} y={140} angle={-135} length={44} sweep={15} opacity={opacity} />
      <Leaf x={198} y={95} angle={40} length={40} sweep={13} opacity={opacity} />
      <Leaf x={214} y={18} angle={-95} length={36} sweep={12} opacity={opacity} />
    </svg>
  );
}

/**
 * Marca d'água botânica estilo tatuagem fine-line (galhos + folhas).
 * Fixa na viewport — presente em toda a loja.
 */
export function BotanicalTattooBackground({
  className,
  placements = DEFAULT,
}: Props) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-[2] overflow-hidden",
        "hidden md:block",
        className
      )}
      aria-hidden
    >
      {placements.map((item, i) => {
        const size = item.size ?? 320;
        const opacity = item.opacity ?? 0.13;
        const rotate = item.rotate ?? 0;
        const aspect = item.motif === "vine" ? 420 / 200 : 360 / 240;

        return (
          <div
            key={`${item.side}-${item.motif}-${i}`}
            className={cn(
              "absolute",
              SIDE_POS[item.side],
              item.className
            )}
            style={{ width: size, height: size * aspect }}
          >
            <div
              className="h-full w-full"
              style={{
                transform: `rotate(${rotate}deg)`,
                transformOrigin: "center",
              }}
            >
              {item.motif === "vine" ? (
                <VineSvg opacity={opacity} />
              ) : (
                <SpraySvg opacity={opacity} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
