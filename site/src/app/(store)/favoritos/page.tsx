import type { Metadata } from "next";
import { FavoritosPageClient } from "@/components/store/FavoritosPageClient";

export const metadata: Metadata = {
  title: "Favoritos",
  description: "Suas peças favoritas da Feliora.",
};

export default function FavoritosPage() {
  return <FavoritosPageClient />;
}
