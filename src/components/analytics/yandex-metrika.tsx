"use client";

import { useEffect } from "react";

const METRIKA_ID = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID;
const CONSENT_KEY = "sl_consent";

// `window.ym` is declared globally in `@/lib/analytics`; here we use the richer
// shape (the loader sets `.a`/`.l`) via a local cast to avoid a conflicting
// global re-declaration.
type Ym = ((...args: unknown[]) => void) & { a?: unknown[][]; l?: number };

function hasConsent(): boolean {
  try {
    return window.localStorage.getItem(CONSENT_KEY) === "granted";
  } catch {
    return false;
  }
}

/**
 * Yandex Metrika — relevant in Kazakhstan, where Yandex holds ~25–28% of search.
 *
 * Metrika has no native consent mode (unlike GA4 Consent Mode), so we honour the
 * site's consent model the only correct way: we **don't load the tag at all**
 * until the visitor grants analytics consent via <ConsentBanner>. Until then no
 * Yandex script loads, no cookies are set, and Webvisor records nothing. The
 * banner dispatches an `sl:consent` CustomEvent on grant, so the counter
 * initialises immediately — no reload needed.
 *
 * Gated on NEXT_PUBLIC_YANDEX_METRIKA_ID (inlined at build time); renders nothing
 * without it. The <noscript> pixel from Yandex's stock snippet is intentionally
 * omitted: it would fire unconditionally and can't respect consent.
 */
export function YandexMetrika() {
  useEffect(() => {
    if (!METRIKA_ID) return;

    let initialized = false;

    function init() {
      if (initialized || !hasConsent() || typeof window.ym === "function") {
        // Already done, no consent yet, or the tag is already present.
        if (typeof window.ym === "function") initialized = true;
        return;
      }
      initialized = true;

      // Stock Metrika loader (counter id from env), de-duped against re-injection.
      const src = `https://mc.yandex.ru/metrika/tag.js?id=${METRIKA_ID}`;
      const ym: Ym = (window.ym =
        window.ym ||
        function (...args: unknown[]) {
          (ym.a = ym.a || []).push(args);
        });
      ym.l = Number(new Date());

      if (![...document.scripts].some((s) => s.src === src)) {
        const k = document.createElement("script");
        k.async = true;
        k.src = src;
        const a = document.getElementsByTagName("script")[0];
        a.parentNode?.insertBefore(k, a);
      }

      window.ym(Number(METRIKA_ID), "init", {
        ssr: true,
        webvisor: true,
        clickmap: true,
        ecommerce: "dataLayer",
        accurateTrackBounce: true,
        trackLinks: true,
      });
    }

    // Init now if consent was already granted in a previous session…
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
