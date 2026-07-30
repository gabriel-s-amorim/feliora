import { CookieConsent } from "@/components/legal/CookieConsent";
import { BotanicalTattooBackground } from "@/components/store/BotanicalTattooBackground";
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
      <div className="store-app flex min-h-full flex-1 flex-col">
        <Header categories={categories} />
        <StoreMobileChrome>
          <main className="relative isolate flex-1">
            <BotanicalTattooBackground />
            <div className="relative z-10">{children}</div>
          </main>
          <Footer categories={categories} />
        </StoreMobileChrome>
        <CookieConsent />
      </div>
    </StoreProviders>
  );
}
