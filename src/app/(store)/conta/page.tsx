import type { Metadata } from "next";
import { AccountDashboard } from "@/components/store/auth/AccountDashboard";

export const metadata: Metadata = {
  title: "Minha conta",
  description: "Gerencie seus dados, endereços e pedidos.",
};

export default function ContaPage() {
  return <AccountDashboard />;
}
