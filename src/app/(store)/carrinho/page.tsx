import type { Metadata } from "next";
import { CartPageClient } from "@/components/store/CartPageClient";

export const metadata: Metadata = {
  title: "Carrinho",
  description: "Revise as peças da sua sacola Feliora.",
};

export default function CarrinhoPage() {
  return <CartPageClient />;
}
