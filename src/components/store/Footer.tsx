"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  CATALOG_NAV,
  SITE_LOGO_PATH,
  SITE_NAME,
  SITE_TAGLINE,
} from "@/shared/const/site";
import type { CategoryNavItem } from "@/shared/types/category";

type FooterProps = {
  categories: CategoryNavItem[];
};

export function Footer({ categories }: FooterProps) {
  const year = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<string | null>(null);

  const exploreLinks = [
    { href: CATALOG_NAV.href, label: CATALOG_NAV.label },
    ...categories.map((c) => ({ href: c.href, label: c.name })),
  ];

  async function subscribe(event: FormEvent) {
    event.preventDefault();
    if (!consent) {
      setStatus("error");
      setMessage("Marque o consentimento para receber novidades.");
      return;
    }
    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          consent: true,
          source: "footer_newsletter",
          website: honeypot,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha na inscrição");
      setStatus("ok");
      setMessage(
        data.duplicate
          ? "Este e-mail já está inscrito."
          : "Inscrição confirmada. Obrigada!"
      );
      setEmail("");
      setConsent(false);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Não foi possível inscrever");
    }
  }

  return (
    <footer className="mt-auto border-t border-line bg-ivory">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <Link href="/" className="inline-block">
            <Image
              src={SITE_LOGO_PATH}
              alt={SITE_NAME}
              width={160}
              height={120}
              className="h-14 w-auto object-contain"
            />
          </Link>
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

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-earth">
            Novidades
          </p>
          <p className="mt-3 text-sm text-ink-muted">
            Receba lançamentos por e-mail. Opt-in explícito — desmarcado por
            padrão.
          </p>
          <form onSubmit={(e) => void subscribe(e)} className="mt-4 space-y-3">
            <label className="sr-only" htmlFor="footer-newsletter-website">
              Não preencha
            </label>
            <input
              id="footer-newsletter-website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="min-h-11 w-full border border-line bg-cream px-3 text-sm text-ink outline-none focus:border-rose-gold"
            />
            <label className="flex items-start gap-2 text-xs text-ink-muted">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Quero receber e-mails de marketing da {SITE_NAME}. Posso
                cancelar a qualquer momento.{" "}
                <Link href="/pages/privacidade" className="text-rose-gold">
                  Privacidade
                </Link>
              </span>
            </label>
            <button
              type="submit"
              disabled={status === "loading"}
              className="min-h-11 w-full border border-rose-gold bg-rose-gold text-xs tracking-[0.14em] text-cream transition-colors hover:bg-rose-gold-light disabled:opacity-50"
            >
              {status === "loading" ? "Enviando…" : "Inscrever"}
            </button>
            {message ? (
              <p
                className={`text-xs ${
                  status === "error" ? "text-red-700" : "text-ink-muted"
                }`}
              >
                {message}
              </p>
            ) : null}
          </form>
        </div>
      </div>

      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-ink-muted sm:px-6 lg:px-8">
          © {year} {SITE_NAME}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
