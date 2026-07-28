import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

/** Rosa peônia — traço de tatuagem (linha um pouco mais marcada) */
export function FloralRose(props: IconProps) {
  return (
    <svg viewBox="0 0 400 480" fill="none" aria-hidden {...props}>
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          strokeWidth="1.45"
          d="M200 92c-18 8-32 28-34 52-2 28 12 52 34 66 22-14 36-38 34-66-2-24-16-44-34-52z"
        />
        <path
          strokeWidth="1.25"
          d="M200 108c-12 7-20 22-20 38 0 20 8 36 20 46 12-10 20-26 20-46 0-16-8-31-20-38z"
        />
        <path
          strokeWidth="1.1"
          d="M200 124c-7 5-12 14-12 24s5 18 12 23c7-5 12-13 12-23s-5-19-12-24z"
        />
        <path strokeWidth="1" d="M188 148c4 6 10 10 12 10s8-4 12-10" />
        <path strokeWidth="1" d="M176 132c8 2 16-2 24-2s16 4 24 2" />
        <path strokeWidth="1" d="M170 158c10-4 20-2 30-2s20-2 30 2" />
        <path
          strokeWidth="1.2"
          d="M166 118c-14-18-8-40 10-48 6 14 4 30-10 48z"
        />
        <path
          strokeWidth="1.2"
          d="M234 118c14-18 8-40-10-48-6 14-4 30 10 48z"
        />
        <path
          strokeWidth="1.2"
          d="M158 168c-22-6-36 14-28 34 16 2 30-10 28-34z"
        />
        <path
          strokeWidth="1.2"
          d="M242 168c22-6 36 14 28 34-16 2-30-10-28-34z"
        />
        <path strokeWidth="1.25" d="M200 210v78" />
        <path
          strokeWidth="1.15"
          d="M200 248c-28-8-48 18-36 42 18 4 32-14 36-42z"
        />
        <path
          strokeWidth="1.15"
          d="M200 268c28-8 48 18 36 42-18 4-32-14-36-42z"
        />
        <path
          strokeWidth="1.15"
          d="M200 300c-24-6-38 16-28 34 14 3 24-12 28-34z"
        />
        <path
          strokeWidth="1.15"
          d="M200 318c24-6 38 16 28 34-14 3-24-12-28-34z"
        />
        <path strokeWidth="1" opacity="0.75" d="M188 236c-6 10-4 22 4 28" />
        <path strokeWidth="1" opacity="0.75" d="M212 256c6 10 4 22-4 28" />
      </g>
    </svg>
  );
}

/** Buquê botânico — flores miúdas + folhagem */
export function FloralSpray(props: IconProps) {
  return (
    <svg viewBox="0 0 320 360" fill="none" aria-hidden {...props}>
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path strokeWidth="1.25" d="M160 40c-8 22-6 48 4 70" />
        <path
          strokeWidth="1.15"
          d="M164 110c18-28 46-36 70-22-8 22-34 34-70 22z"
        />
        <path
          strokeWidth="1.15"
          d="M156 118c-22-24-50-26-72-8 12 20 40 28 72 8z"
        />
        <path
          strokeWidth="1.1"
          d="M168 88c12-8 28-6 38 6-14 10-28 10-38-6z"
        />
        <path
          strokeWidth="1.1"
          d="M152 92c-14-6-28 0-36 12 12 8 26 6 36-12z"
        />
        <circle cx="164" cy="74" r="5" strokeWidth="1.1" />
        <path strokeWidth="1.05" d="M160 150c-4 40-2 80 8 120" />
        <path
          strokeWidth="1.1"
          d="M164 190c-32-4-52 22-40 46 18 2 34-16 40-46z"
        />
        <path
          strokeWidth="1.1"
          d="M168 220c30-6 48 20 36 42-16 4-30-14-36-42z"
        />
        <path
          strokeWidth="1.1"
          d="M172 250c-26-2-40 22-28 40 14 2 24-14 28-40z"
        />
        <path
          strokeWidth="1.15"
          d="M92 200c8-18 28-26 46-16-4 18-24 28-46 16z"
        />
        <path
          strokeWidth="1.15"
          d="M98 208c-16-10-36-4-44 14 16 8 34 4 44-14z"
        />
        <path strokeWidth="1" d="M108 196c0-10 8-18 18-18" />
        <circle cx="118" cy="186" r="3.5" strokeWidth="1" />
        <path
          strokeWidth="1.15"
          d="M230 168c-6-20 6-40 26-46 4 18-6 38-26 46z"
        />
        <path
          strokeWidth="1.15"
          d="M236 172c14-14 36-14 48 4-16 12-36 14-48-4z"
        />
        <circle cx="248" cy="158" r="3.5" strokeWidth="1" />
        <path
          strokeWidth="1.05"
          d="M140 48c-4-10 2-18 12-20 2 8-2 16-12 20z"
        />
        <path
          strokeWidth="1.05"
          d="M178 56c4-12 16-16 26-10-4 10-14 14-26 10z"
        />
        <path strokeWidth="1" opacity="0.8" d="M70 260c20-8 40-4 56 12" />
        <path strokeWidth="1" opacity="0.8" d="M250 240c-18 10-28 28-24 48" />
      </g>
    </svg>
  );
}

/** Videira curva com flores */
export function FloralVine(props: IconProps) {
  return (
    <svg viewBox="0 0 280 420" fill="none" aria-hidden {...props}>
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          strokeWidth="1.3"
          d="M40 40c40 36 48 88 28 132-22 48 8 96 52 120 40 22 72 64 60 112"
        />
        <path
          strokeWidth="1.1"
          d="M68 92c-18 4-28 22-18 36 14-2 24-16 18-36z"
        />
        <path
          strokeWidth="1.1"
          d="M92 118c16-8 34 2 36 20-16 6-30-2-36-20z"
        />
        <path
          strokeWidth="1.1"
          d="M70 168c-20-2-32 16-22 32 14 0 26-12 22-32z"
        />
        <path
          strokeWidth="1.1"
          d="M88 198c18-4 32 12 28 30-16 2-28-12-28-30z"
        />
        <path
          strokeWidth="1.25"
          d="M128 248c-14-16-8-38 10-46 8 12 6 28-10 46z"
        />
        <path
          strokeWidth="1.25"
          d="M148 242c10-18 32-22 46-6-12 14-30 16-46 6z"
        />
        <path
          strokeWidth="1.25"
          d="M142 262c-8-16 4-34 22-38 2 14-6 30-22 38z"
        />
        <path
          strokeWidth="1.25"
          d="M158 268c12-14 34-10 42 8-14 10-32 8-42-8z"
        />
        <circle cx="152" cy="252" r="4.5" strokeWidth="1.1" />
        <path
          strokeWidth="1.05"
          d="M168 300c-16 6-24 24-14 38 12-2 20-16 14-38z"
        />
        <path
          strokeWidth="1.05"
          d="M188 328c14 2 24 18 16 32-12 0-22-14-16-32z"
        />
        <path
          strokeWidth="1.05"
          d="M200 360c-14 8-18 26-6 36 10-6 14-22 6-36z"
        />
        <path
          strokeWidth="1.05"
          d="M48 72c6-8 18-8 24 2-8 6-18 6-24-2z"
        />
        <path
          strokeWidth="1.05"
          d="M52 78c-8-4-10-16-2-24 6 8 8 18 2 24z"
        />
        <circle cx="58" cy="68" r="2.8" strokeWidth="0.95" />
        <path strokeWidth="1" opacity="0.75" d="M110 150c12 4 18 16 12 28" />
        <path strokeWidth="1" opacity="0.75" d="M210 290c8 12 4 26-8 34" />
      </g>
    </svg>
  );
}

/** Ladrilho denso — várias flores pequenas para preencher o campo */
export function FloralFieldTile(props: IconProps) {
  return (
    <svg viewBox="0 0 480 480" fill="none" aria-hidden {...props}>
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.2"
      >
        {/* Rosa pequena */}
        <g transform="translate(40 30)">
          <path d="M60 20c-10 5-18 16-18 30 0 16 8 30 18 38 10-8 18-22 18-38 0-14-8-25-18-30z" />
          <path d="M60 32c-6 4-10 12-10 20s4 15 10 20c6-5 10-12 10-20s-4-16-10-20z" />
          <path d="M60 90v36" />
          <path d="M60 108c-14-4-22 10-16 22 8 1 14-8 16-22z" />
          <path d="M60 118c14-4 22 10 16 22-8 1-14-8-16-22z" />
        </g>
        {/* Spray */}
        <g transform="translate(200 20)">
          <path d="M70 16c-4 14-2 28 4 40" />
          <path d="M74 56c12-16 28-20 42-10-6 12-22 18-42 10z" />
          <path d="M66 60c-14-12-30-12-42-2 8 10 24 14 42 2z" />
          <circle cx="72" cy="40" r="4" />
          <path d="M74 100c-16-2-26 12-20 24 10 1 18-8 20-24z" />
        </g>
        {/* Vine fragment */}
        <g transform="translate(340 50)">
          <path d="M20 10c22 20 26 48 14 72-14 28 6 54 30 66" />
          <path d="M34 40c-10 2-16 12-10 20 8-1 14-8 10-20z" />
          <path d="M48 70c10-4 18 6 16 16-9 1-15-6-16-16z" />
          <path d="M70 110c-8-10-4-24 8-28 4 8 2 18-8 28z" />
          <path d="M82 106c8-10 22-12 30-2-8 8-20 10-30 2z" />
          <circle cx="88" cy="112" r="3.5" />
        </g>
        {/* Bottom left spray */}
        <g transform="translate(20 240)">
          <path d="M50 20c-6 18-2 36 8 52" />
          <path d="M58 72c16-14 36-12 48 4-12 10-30 12-48-4z" />
          <path d="M54 78c-18-8-34 0-40 16 14 6 30 2 40-16z" />
          <circle cx="62" cy="52" r="3.5" />
          <path d="M62 110c-14 0-22 14-14 26 10 0 16-10 14-26z" />
        </g>
        {/* Center rose */}
        <g transform="translate(180 220)">
          <path d="M70 24c-12 6-20 18-20 34 0 18 8 34 20 44 12-10 20-26 20-44 0-16-8-28-20-34z" />
          <path d="M70 40c-7 5-12 14-12 24s5 18 12 24c7-6 12-14 12-24s-5-19-12-24z" />
          <path d="M70 108v40" />
          <path d="M70 128c-16-4-26 12-18 24 10 1 16-10 18-24z" />
          <path d="M70 140c16-4 26 12 18 24-10 1-16-10-18-24z" />
        </g>
        {/* Bottom right */}
        <g transform="translate(320 260)">
          <path d="M30 20c24 18 28 50 12 76-18 30 8 58 36 70" />
          <path d="M44 50c-12 4-18 14-10 24 10-2 16-12 10-24z" />
          <path d="M58 88c12-6 22 6 18 18-10 2-16-8-18-18z" />
          <path d="M80 130c-10-12-4-28 10-32 4 10 0 22-10 32z" />
          <circle cx="98" cy="128" r="4" />
        </g>
        {/* Small buds scattered */}
        <path d="M140 160c4-10 14-14 22-8-4 8-12 12-22 8z" />
        <path d="M300 180c-6-8-2-18 8-22 2 8-2 16-8 22z" />
        <path d="M420 200c4-12 16-16 26-8-6 10-16 14-26 8z" />
        <path d="M100 400c6-10 18-12 26-4-8 8-18 10-26 4z" />
        <path d="M260 400c-8-6-8-18 2-24 4 8 6 18-2 24z" />
        <circle cx="160" cy="300" r="2.5" />
        <circle cx="380" cy="160" r="2.5" />
        <circle cx="90" cy="180" r="2" />
        <circle cx="430" cy="360" r="2.5" />
      </g>
    </svg>
  );
}
