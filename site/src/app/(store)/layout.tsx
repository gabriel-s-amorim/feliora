import { Footer } from "@/components/store/Footer";
import { Header } from "@/components/store/Header";
import { StoreProviders } from "@/components/store/StoreProviders";
import { listActiveCategoryNav } from "@/lib/categories";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await listActiveCategoryNav();

  return (
    <StoreProviders>
      <Header categories={categories} />
      <main className="flex-1">{children}</main>
      <Footer categories={categories} />
    </StoreProviders>
  );
}
