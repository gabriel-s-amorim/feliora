import type { Metadata } from "next";
import { CheckoutPageClient } from "@/components/checkout/CheckoutPageClient";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "Checkout",
    description: "Finalize sua compra na Feliora.",
    path: "/checkout",
    noIndex: true,
  }),
};

export default function CheckoutPage() {
  return <CheckoutPageClient />;
}
