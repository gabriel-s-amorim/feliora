import type { Metadata } from "next";
import { FavoritosPageClient } from "@/components/store/FavoritosPageClient";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "Favoritos",
    description: "Suas peças favoritas da Feliora.",
    path: "/favoritos",
    noIndex: true,
  }),
};

export default function FavoritosPage() {
  return <FavoritosPageClient />;
}
