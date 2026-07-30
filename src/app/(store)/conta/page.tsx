import type { Metadata } from "next";
import { AccountDashboard } from "@/components/store/auth/AccountDashboard";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "Minha conta",
    description: "Gerencie seus dados, endereços e pedidos na Feliora.",
    path: "/conta",
    noIndex: true,
  }),
};

export default function ContaPage() {
  return <AccountDashboard />;
}
