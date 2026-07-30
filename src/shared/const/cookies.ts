/** Consentimento de cookies (LGPD) — cookie client + versão da política. */

export const COOKIE_CONSENT_NAME = "feliora_cookie_consent";
export const COOKIE_POLICY_VERSION = 1;
export const COOKIE_CONSENT_MAX_AGE_SEC = 60 * 60 * 24 * 365; // 1 ano
export const COOKIE_PREFERENCES_EVENT = "feliora:open-cookie-preferences";
export const COOKIE_CONSENT_UPDATED_EVENT = "feliora:cookie-consent-updated";

export type CookieConsentState = {
  v: number;
  essential: true;
  analytics: boolean;
  marketing: boolean;
  ts: number;
};

export function buildConsentState(input: {
  analytics: boolean;
  marketing: boolean;
}): CookieConsentState {
  return {
    v: COOKIE_POLICY_VERSION,
    essential: true,
    analytics: input.analytics,
    marketing: input.marketing,
    ts: Date.now(),
  };
}

export function encodeConsent(state: CookieConsentState): string {
  return encodeURIComponent(JSON.stringify(state));
}

export function decodeConsent(raw: string | null | undefined): CookieConsentState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<CookieConsentState>;
    if (
      typeof parsed.v !== "number" ||
      typeof parsed.analytics !== "boolean" ||
      typeof parsed.marketing !== "boolean" ||
      typeof parsed.ts !== "number"
    ) {
      return null;
    }
    return {
      v: parsed.v,
      essential: true,
      analytics: parsed.analytics,
      marketing: parsed.marketing,
      ts: parsed.ts,
    };
  } catch {
    return null;
  }
}

export function isConsentCurrent(state: CookieConsentState | null): boolean {
  return Boolean(state && state.v === COOKIE_POLICY_VERSION);
}

export function openCookiePreferences() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(COOKIE_PREFERENCES_EVENT));
}
