import Link from "next/link";
import { SITE_NAME } from "@/shared/const/site";
import { Footer } from "@/components/store/Footer";
import { Header } from "@/components/store/Header";
import { StoreProviders } from "@/components/store/StoreProviders";
import { listActiveCategoryNav } from "@/lib/categories";
import { getPublicStoreSettings } from "@/lib/storeSettings";

export default async function NotFound() {
  const [categories, settings] = await Promise.all([
    listActiveCategoryNav(),
    getPublicStoreSettings(),
  ]);

  return (
    <StoreProviders>
      <Header categories={categories} />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <p className="font-display text-xs uppercase tracking-[0.35em] text-rose-gold">
          404
        </p>
        <h1 className="mt-4 font-display text-3xl font-light tracking-[0.06em] text-ink sm:text-4xl">
          Página não encontrada
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-muted">
          O caminho que você buscou não existe em {SITE_NAME}. Volte à home ou
          explore o catálogo.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center border border-rose-gold bg-rose-gold px-7 text-sm tracking-[0.14em] text-cream transition-colors hover:bg-rose-gold-light"
          >
            Ir para a home
          </Link>
          <Link
            href="/catalogo"
            className="inline-flex min-h-12 items-center justify-center border border-line px-7 text-sm tracking-[0.14em] text-ink transition-colors hover:border-rose-gold hover:text-rose-gold"
          >
            Ver catálogo
          </Link>
        </div>
      </main>
      <Footer categories={categories} settings={settings} />
    </StoreProviders>
  );
}
