"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
  // prefilled greeting and the tracked `page` property.
  const pathname = usePathname();
  const [utm, setUtm] = useState<UtmParams>({});

  // Read stored UTM after mount (sessionStorage is client-only). We also call
  // persistUtm here so the CTA never depends on <UtmCapture>'s effect ordering:
  // first-touch is idempotent, so re-running it is safe. This re-renders with
  // the resolved UTM so the href reflects the captured campaign on landing.
  useEffect(() => {
    persistUtm(window.location.search);
    setUtm(getStoredUtm());
  }, []);

  function buildHref(): string {
    if (channel === "whatsapp") {
      return buildWhatsappUrl({
        number: siteConfig.whatsapp,
        page: pathname,
        utm,
      });
    }
    return buildTelegramUrl({ username: siteConfig.telegram });
  }

  function handleClick() {
    // `transport_type: "beacon"` makes gtag send the hit via navigator.sendBeacon,
    // which survives the tab being backgrounded/suspended (common on mobile when
    // the messenger app takes focus) — a normal fetch can be dropped mid-flight.
    // It's a no-op extra property for posthog.capture.
    trackEvent("lead_messenger_click", {
      channel,
      page: pathname,
      transport_type: "beacon",
      ...utm,
    });
  }

  return (
    <Button asChild variant={variant} size={size} className={className}>
      <a
        href={buildHref()}
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
