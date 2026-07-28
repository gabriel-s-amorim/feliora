"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CATALOG_NAV, SITE_LOGO_PATH, SITE_NAME } from "@/shared/const/site";
import type { CategoryNavItem } from "@/shared/types/category";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";

function IconSearch({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19a7 7 0 0 1 14 0" strokeLinecap="round" />
    </svg>
  );
}

function IconHeart({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconBag({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M6 8h12l-1 11H7L6 8z" strokeLinejoin="round" />
      <path d="M9 8V7a3 3 0 0 1 6 0v1" strokeLinecap="round" />
    </svg>
  );
}

function IconMenu({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function IconClose({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

type HeaderProps = {
  categories: CategoryNavItem[];
};

export function Header({ categories }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const { cart, openDrawer } = useCart();
  const { count: wishCount } = useWishlist();
  const { user } = useCustomerAuth();

  const navLinks = [
    { href: CATALOG_NAV.href, label: CATALOG_NAV.label },
    ...categories.map((c) => ({ href: c.href, label: c.name })),
  ];

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:h-16 sm:px-6 lg:px-8">
        <button
          type="button"
          className="flex size-11 shrink-0 items-center justify-center text-ink md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <IconClose className="size-6" />
          ) : (
            <IconMenu className="size-6" />
          )}
        </button>

        <Link
          href="/"
          className="absolute left-1/2 flex -translate-x-1/2 items-center md:static md:translate-x-0"
          onClick={() => setOpen(false)}
        >
          <Image
            src={SITE_LOGO_PATH}
            alt={SITE_NAME}
            width={140}
            height={48}
            className="h-9 w-auto object-contain sm:h-10"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Principal">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-display text-[0.95rem] tracking-[0.12em] text-ink-muted transition-colors hover:text-rose-gold"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile: só busca + sacola (conta/favoritos vão no menu / bottom nav) */}
        <div className="ml-auto flex items-center gap-0.5 md:ml-0">
          <Link
            href="/busca"
            className="flex size-11 items-center justify-center text-ink transition-colors hover:text-rose-gold"
            aria-label="Buscar"
          >
            <IconSearch className="size-5" />
          </Link>
          <Link
            href={user ? "/conta" : "/conta/entrar"}
            className="hidden size-11 items-center justify-center text-ink transition-colors hover:text-rose-gold md:flex"
            aria-label={user ? "Minha conta" : "Entrar"}
          >
            <IconUser className="size-5" />
          </Link>
          <Link
            href="/favoritos"
            className="relative hidden size-11 items-center justify-center text-ink transition-colors hover:text-rose-gold md:flex"
            aria-label="Favoritos"
          >
            <IconHeart className="size-5" />
            {wishCount > 0 ? (
              <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-rose-gold text-[9px] text-cream">
                {wishCount > 9 ? "9+" : wishCount}
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            onClick={openDrawer}
            className="relative flex size-11 items-center justify-center text-ink transition-colors hover:text-rose-gold"
            aria-label="Abrir carrinho"
          >
            <IconBag className="size-5" />
            {cart.itemCount > 0 ? (
              <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-rose-gold text-[9px] text-cream">
                {cart.itemCount > 9 ? "9+" : cart.itemCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* Full-screen mobile menu overlay */}
      {open ? (
        <div
          id="mobile-nav"
          className="fixed inset-0 top-[calc(3.5rem+env(safe-area-inset-top))] z-50 flex flex-col bg-cream md:hidden"
        >
          <nav
            className="flex flex-1 flex-col overflow-y-auto px-6 py-6"
            aria-label="Mobile"
          >
            <p className="mb-4 text-[11px] uppercase tracking-[0.18em] text-earth">
              Explorar
            </p>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="border-b border-line/60 py-4 font-display text-2xl tracking-[0.1em] text-ink transition-colors active:text-rose-gold"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <p className="mb-3 mt-8 text-[11px] uppercase tracking-[0.18em] text-earth">
              Conta
            </p>
            <Link
              href="/favoritos"
              className="border-b border-line/60 py-3.5 font-display text-lg tracking-[0.12em] text-ink"
              onClick={() => setOpen(false)}
            >
              Favoritos
              {wishCount > 0 ? ` (${wishCount})` : ""}
            </Link>
            <Link
              href={user ? "/conta" : "/conta/entrar"}
              className="border-b border-line/60 py-3.5 font-display text-lg tracking-[0.12em] text-ink"
              onClick={() => setOpen(false)}
            >
              {user ? "Minha conta" : "Entrar"}
            </Link>
          </nav>
          <div
            className="border-t border-line px-6 py-4"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openDrawer();
              }}
              className="flex w-full min-h-12 items-center justify-center border border-rose-gold bg-rose-gold text-sm tracking-[0.16em] text-cream"
            >
              Ver sacola
              {cart.itemCount > 0 ? ` · ${cart.itemCount}` : ""}
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
