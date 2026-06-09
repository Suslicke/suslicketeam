"use client";

import posthog from "posthog-js";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const CONSENT_KEY = "sl_consent";
type ConsentDecision = "granted" | "denied";

function readStoredConsent(): ConsentDecision | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

function storeConsent(decision: ConsentDecision): void {
  try {
    window.localStorage.setItem(CONSENT_KEY, decision);
  } catch {
    // ignore storage failures (quota, disabled storage, private mode)
  }
}

/**
 * Lightweight, dismissible cookie-consent banner. Shown only when no decision
 * is stored in localStorage (`sl_consent`). On a decision it updates GA4
 * Consent Mode and PostHog opt-in/out, then hides itself.
 *
 * Fixed to the bottom and contains its own space, so it never causes layout
 * shift in the document flow.
 */
export function ConsentBanner() {
  const t = useTranslations("consent");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only decide visibility on the client to avoid hydration mismatch.
    if (readStoredConsent() === null) {
      setVisible(true);
    }
  }, []);

  function decide(decision: ConsentDecision) {
    storeConsent(decision);
    setVisible(false);

    const granted = decision === "granted";

    // GA4 Consent Mode v2 update. Keep ad storage denied — analytics only.
    try {
      window.gtag?.("consent", "update", {
        analytics_storage: granted ? "granted" : "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
    } catch {
      // gtag may be absent (no GA id) — that's fine, nothing to update.
    }

    // PostHog opt-in / opt-out. Methods exist only when the SDK initialized.
    try {
      if (posthog.__loaded) {
        if (granted) {
          posthog.opt_in_capturing();
          // The manual $pageview effect only fires on *subsequent* navigations,
          // so capture the current (landing) page now that capturing is enabled
          // — otherwise the entry pageview is lost when consent is granted.
          posthog.capture("$pageview");
        } else {
          posthog.opt_out_capturing();
        }
      }
    } catch {
      // SDK not loaded (no key) — graceful no-op.
    }

    // Broadcast the decision so consent-deferred trackers (Yandex Metrika has no
    // native consent mode, so it only loads its tag now) can initialise without
    // a page reload. Stored under the same `sl_consent` key they read on mount.
    try {
      window.dispatchEvent(
        new CustomEvent("sl:consent", { detail: decision }),
      );
    } catch {
      // CustomEvent unsupported — the next page load picks up stored consent.
    }
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={t("title")}
      data-testid="consent-banner"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold">{t("title")}</p>
          <p className="text-sm text-muted-foreground">{t("text")}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="lg"
            onClick={() => decide("denied")}
          >
            {t("decline")}
          </Button>
          <Button
            size="lg"
            className="bg-brand text-brand-foreground hover:bg-brand/90"
            onClick={() => decide("granted")}
          >
            {t("accept")}
          </Button>
        </div>
      </div>
    </div>
  );
}
