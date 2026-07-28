import { CookieConsent } from "@/components/legal/CookieConsent";
import { FloralBackground } from "@/components/store/FloralBackground";
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
      <Header categories={categories} />
      <StoreMobileChrome>
        <main className="relative isolate flex-1">
          <FloralBackground variant="store" />
          <div className="relative z-10">{children}</div>
        </main>
        <Footer categories={categories} />
      </StoreMobileChrome>
      <CookieConsent />
    </StoreProviders>
  );
}
