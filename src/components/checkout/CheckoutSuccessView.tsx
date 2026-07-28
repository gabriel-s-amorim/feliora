"use client";

import Image from "next/image";
import Link from "next/link";
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

  return (
    <section className="mx-auto max-w-lg px-4 py-14 text-center sm:px-6">
      <p className="font-display text-xs uppercase tracking-[0.35em] text-rose-gold">
        {approved ? "Pedido confirmado" : rejected ? "Pagamento recusado" : "Aguardando pagamento"}
      </p>
      <h1 className="mt-4 font-display text-3xl font-light tracking-[0.06em] text-ink">
        {approved
          ? "Obrigada!"
          : rejected
            ? "Não foi possível concluir"
            : "Quase lá"}
      </h1>
      <p className="mt-3 text-sm text-ink-muted">
        Pedido #{order.id.slice(0, 8).toUpperCase()} · {formatPrice(order.totalAmount)}
      </p>
      {polling && !approved && !rejected ? (
        <p className="mt-2 text-xs text-ink-muted">Verificando status…</p>
      ) : null}

      {instructions?.qrCodeBase64 ? (
        <div className="mx-auto mt-8 max-w-xs space-y-3">
          <Image
            src={`data:image/png;base64,${instructions.qrCodeBase64}`}
            alt="QR Code Pix"
            width={240}
            height={240}
            className="mx-auto"
            unoptimized
          />
          {instructions.qrCode ? (
            <p className="break-all rounded border border-line bg-ivory/50 p-3 text-left text-[11px] text-ink-muted">
              {instructions.qrCode}
            </p>
          ) : null}
        </div>
      ) : null}

      {instructions?.ticketUrl ? (
        <a
          href={instructions.ticketUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex min-h-12 items-center justify-center border border-rose-gold px-7 text-sm tracking-[0.14em] text-rose-gold transition-colors hover:bg-rose-gold hover:text-cream"
        >
          Abrir boleto
        </a>
      ) : null}

      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/conta"
          className="inline-flex min-h-12 items-center justify-center bg-rose-gold px-7 text-sm tracking-[0.14em] text-cream transition-colors hover:bg-rose-gold-light"
        >
          Ver meus pedidos
        </Link>
        <Link
          href="/catalogo"
          className="inline-flex min-h-12 items-center justify-center border border-line px-7 text-sm tracking-[0.14em] text-ink transition-colors hover:border-rose-gold hover:text-rose-gold"
        >
          Continuar comprando
        </Link>
      </div>
    </section>
  );
}
