import {
  COOKIE_CONSENT_MAX_AGE_SEC,
  COOKIE_CONSENT_NAME,
  COOKIE_CONSENT_UPDATED_EVENT,
  type CookieConsentState,
  decodeConsent,
  encodeConsent,
  isConsentCurrent,
} from "@/shared/const/cookies";

function readRawCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  if (!match) return null;
  return match.slice(name.length + 1);
}

export function getCookieConsent(): CookieConsentState | null {
  return decodeConsent(readRawCookie(COOKIE_CONSENT_NAME));
}

export function hasCurrentCookieConsent(): boolean {
  return isConsentCurrent(getCookieConsent());
}

export function hasAnalyticsConsent(): boolean {
  const state = getCookieConsent();
  return Boolean(state && isConsentCurrent(state) && state.analytics);
}

export function hasMarketingCookieConsent(): boolean {
  const state = getCookieConsent();
  return Boolean(state && isConsentCurrent(state) && state.marketing);
}

export function saveCookieConsent(state: CookieConsentState): void {
  if (typeof document === "undefined") return;
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${COOKIE_CONSENT_NAME}=${encodeConsent(state)}; Path=/; Max-Age=${COOKIE_CONSENT_MAX_AGE_SEC}; SameSite=Lax${secure}`;
  window.dispatchEvent(
    new CustomEvent(COOKIE_CONSENT_UPDATED_EVENT, { detail: state })
  );
}
