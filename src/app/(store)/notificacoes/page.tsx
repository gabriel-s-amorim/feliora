import type { Metadata } from "next";
import { NotificationsPageClient } from "@/components/store/NotificationsPageClient";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "Notificações",
    description: "Acompanhe atualizações dos seus pedidos na Feliora.",
    path: "/notificacoes",
    noIndex: true,
  }),
};

export default function NotificacoesPage() {
  return <NotificationsPageClient />;
}
