import type { Metadata } from "next";
import { OrderDetailClient } from "@/components/store/orders/OrderDetailClient";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "Detalhe do pedido",
    description: "Acompanhe e converse sobre o seu pedido na Feliora.",
    path: "/conta/pedidos",
    noIndex: true,
  }),
};

export default function ContaPedidoDetailPage() {
  return <OrderDetailClient />;
}
