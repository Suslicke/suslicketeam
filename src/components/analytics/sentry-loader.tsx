"use client";

import { useEffect } from "react";

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const CONSENT_KEY = "sl_consent";

function hasConsent(): boolean {
  try {
    return window.localStorage.getItem(CONSENT_KEY) === "granted";
  } catch {
    return false;
  }
}

/**
 * Sentry — client-side error tracking, consent-gated like the rest of our analytics.
 *
 * Same model as <YandexMetrika>: the SDK is **not loaded at all** until the visitor
 * grants analytics consent via <ConsentBanner> (stored `sl_consent`, or the live
 * `sl:consent` CustomEvent). The `import("@sentry/browser")` is **dynamic on purpose** —
 * the ~30 KB SDK is fetched only after consent, so it never touches the initial bundle
 * or the LCP path (keeps Lighthouse green).
 *
 * Errors only: no session replay (PostHog already does that — adding Sentry replay would
 * double-record sessions) and `sendDefaultPii: false` (no IP/headers), so consent stays
 * analytics-scoped. Gated on NEXT_PUBLIC_SENTRY_DSN (inlined at build time); renders and
 * loads nothing without it. Use a SEPARATE Sentry project from the lead-bot's DSN.
 */
export function SentryLoader() {
  useEffect(() => {
    if (!DSN) return;

    let initialized = false;

    async function init() {
      if (initialized || !hasConsent()) return;
      initialized = true; // set sync (before await) so mount + event can't double-init

      const Sentry = await import("@sentry/browser");
      Sentry.init({
        dsn: DSN,
        environment: process.env.NODE_ENV,
        sendDefaultPii: false, // no IP/headers — consent is analytics-only
        tracesSampleRate: 0, // errors only; no performance tracing
        // No replayIntegration → no session replay (PostHog covers that).
      });
    }

    // Init now if consent was granted in a previous session…
    init();

    // …or the moment the banner reports a grant in this session.
    function onConsent(e: Event) {
      if ((e as CustomEvent<string>).detail === "granted") init();
    }
    window.addEventListener("sl:consent", onConsent);
    return () => window.removeEventListener("sl:consent", onConsent);
  }, []);

  return null;
}
