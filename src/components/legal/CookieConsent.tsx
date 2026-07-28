"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  COOKIE_PREFERENCES_EVENT,
  buildConsentState,
} from "@/shared/const/cookies";
import { SITE_NAME } from "@/shared/const/site";
import {
  getCookieConsent,
  hasCurrentCookieConsent,
  saveCookieConsent,
} from "@/lib/cookies/consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hasCurrentCookieConsent()) {
      setVisible(true);
    }

    function openPreferences() {
      setVisible(true);
    }

    window.addEventListener(COOKIE_PREFERENCES_EVENT, openPreferences);
    return () => {
      window.removeEventListener(COOKIE_PREFERENCES_EVENT, openPreferences);
    };
  }, []);

  function persist(analytics: boolean, marketing: boolean) {
    saveCookieConsent(buildConsentState({ analytics, marketing }));
    setVisible(false);
  }

  function acceptAll() {
    persist(true, true);
  }

  function acceptEssential() {
    persist(false, false);
  }

  if (!visible) return null;

  const existing = getCookieConsent();

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      className="fixed inset-x-0 z-50 border-t border-line bg-cream/95 shadow-[0_-8px_32px_rgba(44,36,27,0.08)] backdrop-blur-md animate-fade-up bottom-[calc(4.25rem+env(safe-area-inset-bottom))] md:bottom-0"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-end md:justify-between md:gap-8 lg:px-8 lg:py-5">
        <div className="max-w-2xl">
          <p
            id="cookie-consent-title"
            className="font-display text-lg font-light tracking-[0.04em] text-ink"
          >
            Cookies e privacidade
          </p>
          <p
            id="cookie-consent-desc"
            className="mt-2 text-sm leading-relaxed text-ink-muted"
          >
            A {SITE_NAME} usa cookies essenciais para carrinho e sessão. Cookies
            de análise e marketing só são ativados com o seu consentimento.{" "}
            <Link
              href="/pages/privacidade"
              className="text-rose-gold underline-offset-2 hover:underline"
            >
              Política de Privacidade
            </Link>
            {existing ? (
              <span className="block mt-1 text-xs text-earth">
                Você pode alterar a escolha a qualquer momento.
              </span>
            ) : null}
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={acceptEssential}
            className="min-h-11 border border-line bg-transparent px-4 text-xs tracking-[0.14em] text-ink transition-colors hover:border-rose-gold hover:text-rose-gold"
          >
            Apenas essenciais
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="min-h-11 border border-rose-gold bg-rose-gold px-4 text-xs tracking-[0.14em] text-cream transition-colors hover:bg-rose-gold-light"
          >
            Aceitar todos
          </button>
        </div>
      </div>
    </div>
  );
}
