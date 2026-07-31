import Link from "next/link";
import type { CategoryNavItem } from "@/shared/types/category";

type Props = {
  categories: CategoryNavItem[];
};

function LeafOrnament() {
  return (
    <svg
      width="52"
      height="28"
      viewBox="0 0 52 28"
      fill="none"
      aria-hidden
      className="text-rose-gold"
    >
      <path
        d="M26 22C26 22 18 16 12 8.5C17.5 9.5 22.5 13 26 18.5C29.5 13 34.5 9.5 40 8.5C34 16 26 22 26 22Z"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      <path
        d="M26 22V10.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="26" cy="24.5" r="1.1" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

export function HomeExploreNav({ categories }: Props) {
  return (
    <section aria-labelledby="home-explore-heading">
      <div className="mx-auto max-w-4xl px-4 py-11 text-center sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="animate-fade-up flex justify-center">
          <LeafOrnament />
        </div>

        <h2
          id="home-explore-heading"
          className="animate-fade-up animate-delay-1 mt-4 font-display text-[2rem] font-light leading-none tracking-[0.14em] text-ink sm:mt-5 sm:text-4xl sm:tracking-[0.18em]"
        >
          Explorar
        </h2>

        <div
          className="animate-fade-up animate-delay-1 mx-auto mt-5 flex max-w-[13rem] items-center gap-3 sm:mt-6 sm:max-w-[16rem]"
          aria-hidden
        >
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-rose-gold/35 to-rose-gold/50" />
          <span className="size-1.5 rotate-45 bg-rose-gold/75" />
          <span className="h-px flex-1 bg-gradient-to-l from-transparent via-rose-gold/35 to-rose-gold/50" />
        </div>

        <p className="animate-fade-up animate-delay-2 mx-auto mt-4 max-w-sm text-sm leading-relaxed text-ink-muted sm:mt-5">
          Escolha o ritmo da peça — do vestido ao detalhe.
        </p>

        <nav className="animate-fade-up animate-delay-3 mt-8 sm:mt-10" aria-label="Categorias">
          <ul className="flex flex-wrap justify-center gap-x-8 gap-y-7 sm:gap-x-11 md:gap-x-14">
            {categories.map((c, i) => (
              <li key={c.id}>
                <Link
                  href={c.href}
                  className="group flex min-w-[5.5rem] flex-col items-center gap-1.5 sm:min-w-[6.5rem]"
                >
                  <span className="font-display text-[0.65rem] tracking-[0.32em] text-rose-gold/75 transition-colors duration-300 group-hover:text-rose-gold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-display text-lg tracking-[0.08em] text-ink transition-colors duration-300 group-hover:text-rose-gold sm:text-xl">
                    {c.name}
                  </span>
                  <span
                    className="mt-0.5 h-px w-0 bg-rose-gold transition-[width] duration-300 ease-out group-hover:w-10 group-focus-visible:w-10"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
