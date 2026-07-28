"use client";

export function CheckoutProcessingOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm">
      <div className="mx-4 max-w-sm border border-line bg-cream px-8 py-10 text-center shadow-lg">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-rose-gold border-t-transparent" />
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
