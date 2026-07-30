"use client";

import { LockKeyhole } from "lucide-react";
import { useEffect } from "react";

export function CheckoutProcessingOverlay({ visible }: { visible: boolean }) {
  useEffect(() => {
    if (!visible) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  if (!visible) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 px-4 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label="Processando pagamento"
    >
      <div className="w-full max-w-sm rounded-2xl border border-line bg-cream px-6 py-9 text-center shadow-2xl sm:px-8">
        <div className="relative mx-auto flex size-14 items-center justify-center rounded-full bg-ivory">
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-rose-gold border-t-transparent" />
          <LockKeyhole className="size-5 text-rose-gold" aria-hidden />
        </div>
        <p className="mt-5 font-display text-xl font-light tracking-[0.06em] text-ink">
          Processando pagamento
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          Aguarde alguns segundos. Não feche esta página.
        </p>
      </div>
    </div>
  );
}
