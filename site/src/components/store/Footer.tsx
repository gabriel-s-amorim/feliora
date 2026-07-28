import Link from "next/link";
import { CATALOG_NAV, SITE_NAME, SITE_TAGLINE } from "@/shared/const/site";
import type { CategoryNavItem } from "@/shared/types/category";

type FooterProps = {
  categories: CategoryNavItem[];
};

export function Footer({ categories }: FooterProps) {
  const year = new Date().getFullYear();

  const exploreLinks = [
    { href: CATALOG_NAV.href, label: CATALOG_NAV.label },
    ...categories.map((c) => ({ href: c.href, label: c.name })),
  ];

  return (
    <footer className="mt-auto border-t border-line bg-ivory">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <p className="font-display text-2xl tracking-[0.28em] text-rose-gold">
            {SITE_NAME.toUpperCase()}
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-muted">
            {SITE_TAGLINE}. Peças com presença, espaço e acabamento cuidadoso.
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-earth">
            Explorar
          </p>
          <ul className="mt-4 space-y-2.5">
            {exploreLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-ink-muted transition-colors hover:text-rose-gold"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-earth">
            Atendimento
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-ink-muted">
            <li>
              <Link
                href="/pages/trocas"
                className="transition-colors hover:text-rose-gold"
              >
                Trocas e devoluções
              </Link>
            </li>
            <li>
              <Link
                href="/pages/privacidade"
                className="transition-colors hover:text-rose-gold"
              >
                Privacidade
              </Link>
            </li>
            <li>
              <Link
                href="/conta"
                className="transition-colors hover:text-rose-gold"
              >
                Minha conta
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-5 text-center text-xs tracking-wide text-ink-muted sm:px-6 lg:px-8">
          © {year} {SITE_NAME}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
