import type { Metadata } from "next";
import { CartPageClient } from "@/components/store/CartPageClient";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "Carrinho",
    description: "Revise as peças da sua sacola Feliora.",
    path: "/carrinho",
    noIndex: true,
  }),
};

export default function CarrinhoPage() {
  return <CartPageClient />;
}
