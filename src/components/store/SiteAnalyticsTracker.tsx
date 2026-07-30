"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  COOKIE_CONSENT_NAME,
  COOKIE_CONSENT_UPDATED_EVENT,
} from "@/shared/const/cookies";
import { hasAnalyticsConsent } from "@/lib/cookies/consent";

const VISITOR_KEY = "feliora_vid";
const SESSION_KEY = "feliora_asid";
const SESSION_TS_KEY = "feliora_asid_ts";
const SESSION_TTL_MS = 30 * 60 * 1000;
const HEARTBEAT_MS = 25_000;

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function getVisitorId(): string {
  const existing = readStorage(VISITOR_KEY);
  if (existing) return existing;
  const id = uuid();
  writeStorage(VISITOR_KEY, id);
  return id;
}

function getSessionId(): string {
  const now = Date.now();
  const existing = readStorage(SESSION_KEY);
  const ts = Number(readStorage(SESSION_TS_KEY) ?? 0);
  if (existing && now - ts < SESSION_TTL_MS) {
    writeStorage(SESSION_TS_KEY, String(now));
    return existing;
  }
  const id = uuid();
  writeStorage(SESSION_KEY, id);
  writeStorage(SESSION_TS_KEY, String(now));
  return id;
}

function detectDevice(): "mobile" | "tablet" | "desktop" {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return "mobile";
  if (typeof window !== "undefined" && window.innerWidth < 768) return "mobile";
  if (typeof window !== "undefined" && window.innerWidth < 1024) return "tablet";
  return "desktop";
}

function referrerHost(): string {
  try {
    if (!document.referrer) return "";
    const host = new URL(document.referrer).hostname.replace(/^www\./, "");
    if (!host) return "";
    if (host === window.location.hostname.replace(/^www\./, "")) return "";
    return host.slice(0, 120);
  } catch {
    return "";
  }
}

async function sendEvent(kind: "pageview" | "heartbeat", path: string) {
  if (!hasAnalyticsConsent()) return;
  const payload = {
    visitorId: getVisitorId(),
    sessionId: getSessionId(),
    path,
    referrerHost: kind === "pageview" ? referrerHost() : "",
    deviceType: detectDevice(),
    kind,
  };

  try {
    const body = JSON.stringify(payload);
    if (kind === "heartbeat" && "sendBeacon" in navigator) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/analytics/collect", blob);
      return;
    }
    await fetch("/api/analytics/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    /* silencioso — analytics não pode quebrar a loja */
  }
}

/**
 * Tracker first-party da loja. Só envia eventos com consentimento de analytics.
 */
export function SiteAnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPathRef = useRef<string>("");
  const enabledRef = useRef(false);

  useEffect(() => {
    function refreshConsent() {
      enabledRef.current = hasAnalyticsConsent();
    }
    refreshConsent();

    function onStorage(event: StorageEvent) {
      if (event.key === COOKIE_CONSENT_NAME || event.key === null) {
        refreshConsent();
      }
    }

    function onConsentUpdated() {
      refreshConsent();
      if (
        hasAnalyticsConsent() &&
        lastPathRef.current &&
        !lastPathRef.current.startsWith("/admin")
      ) {
        void sendEvent("pageview", lastPathRef.current);
      }
    }

    const onFocus = () => refreshConsent();
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, onConsentUpdated);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, onConsentUpdated);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    const search = searchParams?.toString();
    const path = search ? `${pathname}?${search}` : pathname;
    // Evita duplicar pageview no mesmo path em re-renders rápidos
    if (path === lastPathRef.current) return;
    lastPathRef.current = path;

    if (!hasAnalyticsConsent()) return;
    enabledRef.current = true;
    void sendEvent("pageview", path);
  }, [pathname, searchParams]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!enabledRef.current || !hasAnalyticsConsent()) return;
      if (document.visibilityState !== "visible") return;
      const path = lastPathRef.current || pathname || "/";
      void sendEvent("heartbeat", path);
    }, HEARTBEAT_MS);

    return () => window.clearInterval(timer);
  }, [pathname]);

  return null;
}
