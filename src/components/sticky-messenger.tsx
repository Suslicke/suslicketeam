"use client";

import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { trackEvent } from "@/lib/analytics";
import { siteConfig } from "@/lib/config";
import { buildWhatsappUrl } from "@/lib/messenger";
import { getStoredUtm, persistUtm, type UtmParams } from "@/lib/utm";

/**
 * Sticky WhatsApp FAB shown only on small screens (hidden on `sm:` and up). Reuses
 * the same URL-building + `lead_messenger_click` tracking as `MessengerCTA`, but
 * rendered as a floating action button rather than an inline CTA.
 */
export function StickyMessenger() {
  const pathname = usePathname();
  const t = useTranslations("home");
  const [utm, setUtm] = useState<UtmParams>({});

  useEffect(() => {
    persistUtm(window.location.search);
    setUtm(getStoredUtm());
  }, []);

  const href = buildWhatsappUrl({
    number: siteConfig.whatsapp,
    page: pathname,
    utm,
  });

  function handleClick() {
    trackEvent("lead_messenger_click", {
      channel: "whatsapp",
      page: pathname,
      source: "sticky_fab",
      transport_type: "beacon",
      ...utm,
    });
  }

  const label = t("sticky_cta");

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      data-channel="whatsapp"
      aria-label={label}
      title={label}
      className="fixed right-4 bottom-4 z-40 flex size-14 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-lg shadow-brand/30 transition-transform hover:scale-105 active:scale-95 sm:hidden"
    >
      <MessageCircle className="size-6" />
    </a>
  );
}
