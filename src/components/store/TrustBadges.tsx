import { CreditCard, LockKeyhole, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

type BrandProps = {
  label: string;
  children: ReactNode;
};

function PaymentBrand({ label, children }: BrandProps) {
  return (
    <li
      title={label}
      aria-label={label}
      className="flex h-9 min-w-14 items-center justify-center rounded-md border border-line bg-white px-2 shadow-[0_1px_2px_rgba(44,36,27,0.04)]"
    >
      {children}
    </li>
  );
}

function Visa() {
  return (
    <svg viewBox="0 0 54 18" className="h-4 w-12" aria-hidden="true">
      <text
        x="27"
        y="14"
        textAnchor="middle"
        fill="#1434CB"
        fontFamily="Arial, sans-serif"
        fontSize="15"
        fontStyle="italic"
        fontWeight="800"
      >
        VISA
      </text>
    </svg>
  );
}

function Mastercard() {
  return (
    <svg viewBox="0 0 48 24" className="h-6 w-12" aria-hidden="true">
      <circle cx="19" cy="12" r="9" fill="#EB001B" />
      <circle cx="29" cy="12" r="9" fill="#F79E1B" />
      <path
        d="M24 4.8a9 9 0 0 1 0 14.4 9 9 0 0 1 0-14.4Z"
        fill="#FF5F00"
      />
    </svg>
  );
}

function Elo() {
  return (
    <svg viewBox="0 0 50 22" className="h-5 w-12" aria-hidden="true">
      <text
        x="4"
        y="16"
        fill="#111111"
        fontFamily="Arial, sans-serif"
        fontSize="16"
        fontWeight="800"
      >
        elo
      </text>
      <path d="M37 4a8 8 0 0 1 5 3" stroke="#EF4123" strokeWidth="3" />
      <path d="M43 8a8 8 0 0 1 0 6" stroke="#FBBF24" strokeWidth="3" />
      <path d="M42 15a8 8 0 0 1-5 3" stroke="#00A4E0" strokeWidth="3" />
    </svg>
  );
}

function Amex() {
  return (
    <svg viewBox="0 0 54 24" className="h-6 w-12" aria-hidden="true">
      <rect x="1" y="2" width="52" height="20" rx="3" fill="#016FD0" />
      <text
        x="27"
        y="16"
        textAnchor="middle"
        fill="white"
        fontFamily="Arial, sans-serif"
        fontSize="10"
        fontWeight="800"
      >
        AMEX
      </text>
    </svg>
  );
}

function Hipercard() {
  return (
    <svg viewBox="0 0 58 22" className="h-5 w-[3.25rem]" aria-hidden="true">
      <rect x="1" y="2" width="56" height="18" rx="4" fill="#B3131B" />
      <text
        x="29"
        y="15"
        textAnchor="middle"
        fill="white"
        fontFamily="Arial, sans-serif"
        fontSize="8.5"
        fontStyle="italic"
        fontWeight="700"
      >
        hipercard
      </text>
    </svg>
  );
}

function Pix() {
  return (
    <svg viewBox="0 0 52 22" className="h-5 w-12" aria-hidden="true">
      <g transform="translate(3 3)" fill="none" stroke="#32BCAD" strokeWidth="2">
        <path d="m8 0 6 6a3 3 0 0 1 0 4l-6 6-6-6a3 3 0 0 1 0-4Z" />
        <path d="m4 4 4 4 4-4M4 12l4-4 4 4" />
      </g>
      <text
        x="26"
        y="15"
        fill="#245C57"
        fontFamily="Arial, sans-serif"
        fontSize="11"
        fontWeight="700"
      >
        PIX
      </text>
    </svg>
  );
}

const TRUST_ITEMS = [
  {
    title: "Compra segura",
    description: "Ambiente protegido por HTTPS",
    icon: LockKeyhole,
  },
  {
    title: "Pagamento protegido",
    description: "Processado pelo Mercado Pago",
    icon: ShieldCheck,
  },
  {
    title: "Dados preservados",
    description: "Não armazenamos o seu cartão",
    icon: CreditCard,
  },
] as const;

export function TrustBadges() {
  return (
    <section
      aria-label="Segurança e formas de pagamento"
      className="border-t border-line"
    >
      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-3">
          {TRUST_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex items-center gap-3 rounded-xl border border-line/80 bg-cream/60 px-3.5 py-3 text-left"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-rose-gold/10 text-rose-gold">
                  <Icon className="size-4" strokeWidth={1.8} />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-ink">
                    {item.title}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-ink-muted">
                    {item.description}
                  </span>
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-center sm:text-left">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-earth">
              Formas de pagamento
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              Cartões, Pix e boleto via Mercado Pago
            </p>
          </div>
          <ul className="flex max-w-full flex-wrap items-center justify-center gap-2 sm:justify-end">
            <PaymentBrand label="Visa">
              <Visa />
            </PaymentBrand>
            <PaymentBrand label="Mastercard">
              <Mastercard />
            </PaymentBrand>
            <PaymentBrand label="Elo">
              <Elo />
            </PaymentBrand>
            <PaymentBrand label="American Express">
              <Amex />
            </PaymentBrand>
            <PaymentBrand label="Hipercard">
              <Hipercard />
            </PaymentBrand>
            <PaymentBrand label="Pix">
              <Pix />
            </PaymentBrand>
          </ul>
        </div>
      </div>
    </section>
  );
}
