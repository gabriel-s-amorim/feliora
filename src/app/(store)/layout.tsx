import { CookieConsent } from "@/components/legal/CookieConsent";
import { FloralBackdrop } from "@/components/store/FloralBackdrop";
import { Footer } from "@/components/store/Footer";
import { Header } from "@/components/store/Header";
import { StoreMobileChrome } from "@/components/store/StoreMobileChrome";
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
      <FloralBackdrop />
      <div className="relative z-[2] flex min-h-full flex-1 flex-col">
        <Header categories={categories} />
        <StoreMobileChrome>
          <main className="flex-1">{children}</main>
          <Footer categories={categories} />
        </StoreMobileChrome>
      </div>
      <CookieConsent />
    </StoreProviders>
  );
}
