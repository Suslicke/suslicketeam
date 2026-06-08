"use client";

import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { getStoredUtm, persistUtm, type UtmParams } from "@/lib/utm";

// Stable answer keys — mirror `qrWelcome.options.*` and the API route's enum.
const ANSWERS = ["shirt", "met", "event", "friend", "other"] as const;
type Answer = (typeof ANSWERS)[number];

// Only people who arrived via the shirt QR (`/card` sets this) ever see this.
const TRIGGER_SOURCE = "shirt";
// Shown at most once per browser.
const SEEN_KEY = "sl_qr_survey";
// Small delay so the page settles (and the cookie banner is seen first).
const SHOW_DELAY_MS = 1200;

function alreadySeen(): boolean {
  try {
    return window.localStorage.getItem(SEEN_KEY) === "done";
  } catch {
    return false;
  }
}

function markSeen(): void {
  try {
    window.localStorage.setItem(SEEN_KEY, "done");
  } catch {
    // ignore storage failures
  }
}

/**
 * Thank-you + 1-question survey shown to visitors who scanned the shirt QR.
 * Detects them via the first-touch UTM (`utm_source=shirt`) captured in
 * sessionStorage, shows once, and on submit both fires a (consent-gated)
 * analytics event AND posts to `/api/qr-survey` (which forwards to the Google
 * Sheet — guaranteed save regardless of cookie consent).
 */
export function QrWelcome() {
  const t = useTranslations("qrWelcome");
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [utm, setUtm] = useState<UtmParams>({});
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [detail, setDetail] = useState("");
  const [done, setDone] = useState(false);

  // Resolve eligibility after mount (storage is client-only). persistUtm is
  // idempotent (first-touch wins), so calling it here is safe and protects
  // against effect-ordering vs <UtmCapture>.
  useEffect(() => {
    if (alreadySeen()) return;

    function evaluate() {
      persistUtm(window.location.search);
      const stored = getStoredUtm();
      if (stored.utm_source === TRIGGER_SOURCE && !alreadySeen()) {
        setUtm(stored);
        return true;
      }
      return false;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    function maybeShow() {
      if (evaluate()) {
        timer = setTimeout(() => setOpen(true), SHOW_DELAY_MS);
      }
    }

    maybeShow();
    window.addEventListener("sl:utm", maybeShow);
    return () => {
      window.removeEventListener("sl:utm", maybeShow);
      if (timer) clearTimeout(timer);
    };
  }, []);

  function close() {
    // Closing without answering still counts as seen — don't nag.
    markSeen();
    setOpen(false);
  }

  function submit() {
    if (!answer) return;
    // Only the "other" option has a free-text field, so detail is carried only
    // for "other" — this avoids a stale value leaking onto another answer.
    const trimmed = detail.trim().slice(0, 500);
    const payload = {
      answer,
      detail: answer === "other" ? trimmed || undefined : undefined,
      source: utm.utm_source,
      campaign: utm.utm_campaign,
      page: pathname,
    };

    // 1) Analytics (consent-gated): PostHog + GA.
    trackEvent("qr_survey_response", {
      answer,
      detail: payload.detail ?? "",
      page: pathname,
      ...utm,
    });

    // 2) Guaranteed sink: server route -> Google Sheet (no consent dependency).
    void fetch("/api/qr-survey", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Best-effort — the analytics event already covers the consented case.
    });

    markSeen();
    setDone(true);
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in motion-reduce:animate-none" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2",
            "rounded-2xl border border-border bg-card p-6 shadow-2xl outline-none",
            "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 motion-reduce:animate-none",
          )}
        >
          <Dialog.Close
            aria-label={t("close")}
            className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-5" />
          </Dialog.Close>

          {done ? (
            <div className="flex flex-col gap-3">
              <Dialog.Title className="font-display text-xl font-bold tracking-tight">
                {t("done_title")}
              </Dialog.Title>
              <Dialog.Description className="text-pretty text-muted-foreground">
                {t("done_text")}
              </Dialog.Description>
              <Button
                onClick={close}
                className="mt-2 h-11 w-full bg-brand text-base font-medium text-brand-foreground hover:bg-brand/90"
              >
                {t("close")}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 pr-6">
                <Dialog.Title className="font-display text-xl font-bold tracking-tight">
                  {t("title")}
                </Dialog.Title>
                <Dialog.Description className="text-pretty text-sm text-muted-foreground">
                  {t("subtitle")}
                </Dialog.Description>
              </div>

              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1 text-sm font-medium">
                  {t("question")}
                </legend>
                {ANSWERS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setAnswer(key)}
                    aria-pressed={answer === key}
                    className={cn(
                      "rounded-lg border px-4 py-2.5 text-left text-sm transition-colors",
                      answer === key
                        ? "border-brand bg-brand/10 text-foreground"
                        : "border-border bg-background hover:bg-muted",
                    )}
                  >
                    {t(`options.${key}`)}
                  </button>
                ))}
              </fieldset>

              {answer === "other" && (
                <input
                  type="text"
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  maxLength={500}
                  placeholder={t("other_placeholder")}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              )}

              <div className="mt-1 flex items-center gap-3">
                <Button
                  onClick={submit}
                  disabled={!answer}
                  className="h-11 flex-1 bg-brand text-base font-medium text-brand-foreground hover:bg-brand/90"
                >
                  {t("submit")}
                </Button>
                <button
                  type="button"
                  onClick={close}
                  className="px-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("skip")}
                </button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
