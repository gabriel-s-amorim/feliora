"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, CircleX, Clock3 } from "lucide-react";
import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@/shared/types/order";

export function CheckoutSuccessView({
  order,
  polling,
}: {
  order: Order;
  polling?: boolean;
}) {
  const instructions = order.paymentInstructions;
  const approved = order.paymentStatus === "approved";
  const rejected = order.paymentStatus === "rejected";
  const isPix = order.paymentMethod === "pix";
  const isBoleto = order.paymentMethod === "boleto";
  const [copied, setCopied] = useState(false);

  async function copyPixCode() {
    if (!instructions?.qrCode) return;
    try {
      await navigator.clipboard.writeText(instructions.qrCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // silencioso
    }
  }

  return (
    <section className="mx-auto max-w-lg px-3 py-8 text-center sm:px-6 sm:py-14">
      <div
        className={`mx-auto flex size-16 items-center justify-center rounded-full ${
          approved
            ? "bg-emerald-50 text-emerald-700"
            : rejected
              ? "bg-red-50 text-red-700"
              : "bg-ivory text-rose-gold"
        }`}
      >
        {approved ? (
          <Check className="size-7" aria-hidden />
        ) : rejected ? (
          <CircleX className="size-7" aria-hidden />
        ) : (
          <Clock3 className="size-7" aria-hidden />
        )}
      </div>
      <p className="mt-5 font-display text-xs uppercase tracking-[0.35em] text-rose-gold">
        {approved
          ? "Pedido confirmado"
          : rejected
            ? "Pagamento recusado"
            : "Aguardando pagamento"}
      </p>
      <h1 className="mt-3 font-display text-3xl font-light tracking-[0.06em] text-ink">
        {approved
          ? "Obrigada!"
          : rejected
            ? "Não foi possível concluir"
            : "Quase lá"}
      </h1>
      <p className="mt-3 text-sm text-ink-muted">
        Pedido #{order.id.slice(0, 8).toUpperCase()} ·{" "}
        {formatPrice(order.totalAmount)}
      </p>
      {polling && !approved && !rejected ? (
        <p className="mt-2 text-xs text-ink-muted">Verificando status…</p>
      ) : null}

      {isPix && (instructions?.qrCodeBase64 || instructions?.qrCode) ? (
        <div className="mx-auto mt-8 max-w-sm space-y-3 rounded-2xl border border-line bg-cream p-4 shadow-[0_16px_45px_rgba(44,36,27,0.05)]">
          {instructions.qrCodeBase64 ? (
            <Image
              src={`data:image/png;base64,${instructions.qrCodeBase64}`}
              alt="QR Code Pix"
              width={240}
              height={240}
              className="mx-auto rounded-xl"
              unoptimized
            />
          ) : null}
          {instructions.qrCode ? (
            <>
              <p className="max-h-24 overflow-y-auto break-all rounded-xl border border-line bg-ivory/50 p-3 text-left text-[11px] text-ink-muted">
                {instructions.qrCode}
              </p>
              <button
                type="button"
                onClick={() => void copyPixCode()}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-rose-gold px-7 text-sm font-medium tracking-[0.1em] text-rose-gold transition-colors hover:bg-rose-gold hover:text-cream"
              >
                {copied ? "Código copiado" : "Copiar código Pix"}
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      {isBoleto && instructions?.ticketUrl ? (
        <a
          href={instructions.ticketUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-rose-gold px-7 text-sm tracking-[0.1em] text-rose-gold transition-colors hover:bg-rose-gold hover:text-cream sm:w-auto"
        >
          Abrir boleto
        </a>
      ) : null}

      {isBoleto && instructions?.barcode ? (
        <p className="mt-4 break-all text-xs text-ink-muted">
          {instructions.barcode}
        </p>
      ) : null}

      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/conta"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-rose-gold px-7 text-sm font-medium tracking-[0.1em] text-cream transition-colors hover:bg-rose-gold-light sm:w-auto"
        >
          Ver meus pedidos
        </Link>
        <Link
          href="/catalogo"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-line px-7 text-sm tracking-[0.1em] text-ink transition-colors hover:border-rose-gold hover:text-rose-gold sm:w-auto"
        >
          Continuar comprando
        </Link>
      </div>
    </section>
  );
}
