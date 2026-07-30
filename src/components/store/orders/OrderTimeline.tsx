import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Order } from "@/shared/types/order";

type Step = {
  key: string;
  label: string;
  at: string | null;
  done: boolean;
};

function buildSteps(order: Order): Step[] {
  const canceled =
    order.status === "canceled" || order.fulfillmentStatus === "canceled";
  const paid =
    Boolean(order.paidAt) ||
    order.paymentStatus === "approved" ||
    order.status === "paid";
  const preparing =
    Boolean(order.processingAt) ||
    order.fulfillmentStatus === "processing" ||
    order.fulfillmentStatus === "shipped" ||
    order.fulfillmentStatus === "delivered";
  const shipped =
    Boolean(order.shippedAt) ||
    order.fulfillmentStatus === "shipped" ||
    order.fulfillmentStatus === "delivered";
  const delivered =
    Boolean(order.deliveredAt) || order.fulfillmentStatus === "delivered";

  return [
    {
      key: "created",
      label: "Pedido realizado",
      at: order.createdAt,
      done: true,
    },
    {
      key: "paid",
      label: "Pagamento aprovado",
      at: order.paidAt,
      done: paid && !canceled,
    },
    {
      key: "processing",
      label: "Preparando",
      at: order.processingAt,
      done: preparing && !canceled,
    },
    {
      key: "shipped",
      label: "Enviado",
      at: order.shippedAt,
      done: shipped && !canceled,
    },
    {
      key: "delivered",
      label: "Entregue",
      at: order.deliveredAt,
      done: delivered && !canceled,
    },
  ];
}

export function OrderTimeline({ order }: { order: Order }) {
  const steps = buildSteps(order);
  const canceled =
    order.status === "canceled" || order.fulfillmentStatus === "canceled";

  return (
    <ol className="space-y-0">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <li key={step.key} className="relative flex gap-3 pb-5 last:pb-0">
            {!isLast ? (
              <span
                className={cn(
                  "absolute left-[0.7rem] top-6 h-[calc(100%-1.25rem)] w-px",
                  step.done ? "bg-rose-gold/50" : "bg-line"
                )}
                aria-hidden
              />
            ) : null}
            <span
              className={cn(
                "relative z-[1] mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border",
                step.done
                  ? "border-rose-gold bg-rose-gold text-cream"
                  : "border-line bg-cream text-transparent"
              )}
            >
              <Check className="size-3" strokeWidth={2.5} />
            </span>
            <div className="min-w-0 pt-0.5">
              <p
                className={cn(
                  "text-sm",
                  step.done ? "text-ink" : "text-ink-muted"
                )}
              >
                {step.label}
              </p>
              {step.at ? (
                <p className="mt-0.5 text-xs text-ink-muted">
                  {new Date(step.at).toLocaleString("pt-BR")}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
      {canceled ? (
        <li className="mt-1 border border-rose-gold/25 bg-rose-gold/5 px-3 py-2 text-sm text-rose-gold">
          Pedido cancelado
          {order.canceledAt
            ? ` · ${new Date(order.canceledAt).toLocaleString("pt-BR")}`
            : ""}
        </li>
      ) : null}
    </ol>
  );
}
