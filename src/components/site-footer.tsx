"use client";

import { useTranslations } from "next-intl";

import { LanguageSwitcher } from "@/components/language-switcher";
import { MessengerCTA } from "@/components/messenger-cta";
import { Link } from "@/i18n/routing";

const NAV_ITEMS = [
  { href: "/services", key: "services" },
  { href: "/cases", key: "cases" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;

const LEGAL_ITEMS = [
  { href: "/privacy", key: "privacy" },
  { href: "/terms", key: "terms" },
] as const;

export function SiteFooter() {
  const t = useTranslations("common");
  const meta = useTranslations("meta");

  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <span className="font-display text-lg font-bold">
            {meta("site_name")}
          </span>
          <p className="text-sm text-muted-foreground">
            {meta("default_description")}
          </p>
        </div>

        <nav className="flex flex-col gap-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col items-start gap-2">
          <MessengerCTA
            channel="whatsapp"
            variant="link"
            className="h-auto p-0 text-sm font-normal text-muted-foreground transition-colors hover:text-foreground hover:no-underline"
            label={t("cta_whatsapp")}
          />
          <MessengerCTA
            channel="telegram"
            variant="link"
            className="h-auto p-0 text-sm font-normal text-muted-foreground transition-colors hover:text-foreground hover:no-underline"
            label={t("cta_telegram")}
          />
        </div>

        <div className="flex flex-col gap-3">
          <LanguageSwitcher />
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>
              © {year} {meta("site_name")}
            </span>
            <span aria-hidden className="opacity-40">
              ·
            </span>
            <span>{t("legal_entity")}</span>
          </p>
          <nav aria-label={t("legal")} className="flex flex-wrap gap-x-4 gap-y-1">
            {LEGAL_ITEMS.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="transition-colors hover:text-foreground"
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
