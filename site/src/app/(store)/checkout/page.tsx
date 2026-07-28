import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Finalize sua compra na Feliora.",
};

/** Placeholder até a Fase 6. */
export default function CheckoutPlaceholderPage() {
  return (
    <section className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
      <p className="font-display text-xs uppercase tracking-[0.35em] text-rose-gold">
        Em breve
      </p>
      <h1 className="mt-4 font-display text-3xl font-light tracking-[0.06em] text-ink">
        Checkout
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-ink-muted">
        Frete, pagamento e finalização chegam nas próximas fases. Seu carrinho
        já está salvo.
      </p>
      <Link
        href="/carrinho"
        className="mt-10 inline-flex min-h-12 items-center justify-center border border-rose-gold px-7 text-sm tracking-[0.14em] text-rose-gold transition-colors hover:bg-rose-gold hover:text-cream"
      >
        Voltar ao carrinho
      </Link>
    </section>
  );
}
