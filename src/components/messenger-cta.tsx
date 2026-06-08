"use client";

import { usePathname } from "next/navigation";
import { type MouseEvent, useEffect, useState } from "react";

import { Button, type buttonVariants } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { siteConfig } from "@/lib/config";
import { buildTelegramUrl, buildWhatsappUrl } from "@/lib/messenger";
import { getStoredUtm, persistUtm, type UtmParams } from "@/lib/utm";
import type { VariantProps } from "class-variance-authority";

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

export interface MessengerCTAProps {
  channel: "whatsapp" | "telegram";
  variant?: ButtonVariantProps["variant"];
  size?: ButtonVariantProps["size"];
  className?: string;
  label: string;
}

/**
 * Reusable messenger call-to-action rendered as a shadcn-styled link. Builds the
 * WhatsApp/Telegram URL from `siteConfig`, embedding the current page and stored
 * first-touch UTM params, and fires a `lead_messenger_click` event before the
 * link opens (no preventDefault — analytics fire, then native navigation).
 */
export function MessengerCTA({
  channel,
  variant,
  size,
  className,
  label,
}: MessengerCTAProps) {
  // Full path including locale prefix (e.g. "/ru/contact"), used for the
  // prefilled greeting and the tracked `page` property. Kept in state so a
  // late-arriving UTM (see below) re-renders the href reactively, and so the
  // pathname snapshot at the time UTM resolves stays consistent.
  const routerPathname = usePathname();
  const [pathname, setPathname] = useState<string>(routerPathname);
  const [utm, setUtm] = useState<UtmParams>(() => getStoredUtm());

  // Read stored UTM after mount (sessionStorage is client-only). We also call
  // persistUtm here so the CTA never depends on <UtmCapture>'s effect ordering:
  // first-touch is idempotent, so re-running it is safe. Beyond that we listen
  // for the `sl:utm` event UtmCapture dispatches after persisting, so the href
  // refreshes deterministically even if our effect ran before persistence.
  useEffect(() => {
    function refresh() {
      persistUtm(window.location.search);
      setUtm(getStoredUtm());
      setPathname(window.location.pathname);
    }

    refresh();
    window.addEventListener("sl:utm", refresh);
    return () => window.removeEventListener("sl:utm", refresh);
  }, []);

  // Keep the tracked/rendered pathname in sync with client navigations.
  useEffect(() => {
    setPathname(routerPathname);
  }, [routerPathname]);

  // Build a fresh URL from the latest stored UTM + current path. Used both for
  // the rendered (best-effort) href and, at click time, as the source of truth.
  function buildHref(resolvedUtm: UtmParams, page: string): string {
    if (channel === "whatsapp") {
      return buildWhatsappUrl({
        number: siteConfig.whatsapp,
        page,
        utm: resolvedUtm,
      });
    }
    return buildTelegramUrl({
      username: siteConfig.telegram,
      page,
      utm: resolvedUtm,
    });
  }

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    // Click-time is the source of truth: re-read UTM + path fresh so the opened
    // link always carries the latest captured campaign even if a re-render was
    // missed. Rewrite the anchor's href before the browser follows it.
    const liveUtm = getStoredUtm();
    const livePage = window.location.pathname;
    event.currentTarget.href = buildHref(liveUtm, livePage);

    // `transport_type: "beacon"` makes gtag send the hit via navigator.sendBeacon,
    // which survives the tab being backgrounded/suspended (common on mobile when
    // the messenger app takes focus) — a normal fetch can be dropped mid-flight.
    // It's a no-op extra property for posthog.capture.
    trackEvent("lead_messenger_click", {
      channel,
      page: livePage,
      transport_type: "beacon",
      ...liveUtm,
    });
  }

  return (
    <Button asChild variant={variant} size={size} className={className}>
      <a
        href={buildHref(utm, pathname)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        data-channel={channel}
      >
        {label}
      </a>
    </Button>
  );
}
