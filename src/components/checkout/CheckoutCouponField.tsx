"use client";

import { Tag, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";

const fieldClassName =
  "min-h-12 w-full rounded-xl border border-line bg-cream px-3.5 text-base text-ink outline-none transition-[border-color,box-shadow,background-color] placeholder:text-ink-muted/60 focus:border-rose-gold focus:bg-white focus:shadow-[0_0_0_3px_rgba(183,110,121,0.12)]";

export function CheckoutCouponField() {
  const { couponApplication, applyCoupon, removeCoupon } = useCart();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    const result = await applyCoupon(code);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCode("");
    setSuccess("Cupom aplicado");
  }

  async function handleRemove() {
    setBusy(true);
    setError(null);
    setSuccess(null);
    await removeCoupon();
    setBusy(false);
  }

  if (couponApplication) {
    return (
      <div className="rounded-xl border border-emerald-700/20 bg-emerald-700/5 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-medium text-ink">
              <Tag className="size-4 text-emerald-700" aria-hidden />
              <span className="truncate">{couponApplication.code}</span>
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              {couponApplication.discountAmount > 0
                ? `Desconto de ${formatPrice(couponApplication.discountAmount)}`
                : couponApplication.grantsFreeShipping
                  ? "Frete grátis aplicado"
                  : "Cupom aplicado"}
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleRemove()}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-cream hover:text-ink disabled:opacity-40"
            aria-label="Remover cupom"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleApply(e)} className="space-y-2">
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
            setSuccess(null);
          }}
          className={fieldClassName}
          placeholder="Código do cupom"
          autoComplete="off"
          disabled={busy}
          aria-label="Cupom de desconto"
        />
        <button
          type="submit"
          disabled={busy || !code.trim()}
          className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl border border-line bg-ivory px-4 text-sm font-medium text-ink transition-colors hover:border-rose-gold disabled:opacity-40"
        >
          {busy ? "…" : "Aplicar"}
        </button>
      </div>
      {error ? (
        <p className="text-xs text-rose-gold" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="text-xs text-emerald-700" role="status">
          {success}
        </p>
      ) : null}
    </form>
  );
}
