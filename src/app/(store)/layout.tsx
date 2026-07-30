import { Suspense } from "react";
import { CookieConsent } from "@/components/legal/CookieConsent";
import { BotanicalTattooBackground } from "@/components/store/BotanicalTattooBackground";
import { Footer } from "@/components/store/Footer";
import { Header } from "@/components/store/Header";
import { SiteAnalyticsTracker } from "@/components/store/SiteAnalyticsTracker";
import { StoreMobileChrome } from "@/components/store/StoreMobileChrome";
import { StoreProviders } from "@/components/store/StoreProviders";
import { listActiveCategoryNav } from "@/lib/categories";
import { getPublicStoreSettings } from "@/lib/storeSettings";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [categories, settings] = await Promise.all([
    listActiveCategoryNav(),
    getPublicStoreSettings(),
  ]);

  return (
    <StoreProviders>
      <div className="store-app flex min-h-full flex-1 flex-col">
        <Header categories={categories} />
        <StoreMobileChrome>
          <main className="relative isolate flex-1">
            <BotanicalTattooBackground />
            <div className="relative z-10">{children}</div>
          </main>
          <Footer categories={categories} settings={settings} />
        </StoreMobileChrome>
        <CookieConsent />
        <Suspense fallback={null}>
          <SiteAnalyticsTracker />
        </Suspense>
      </div>
    </StoreProviders>
  );
}
