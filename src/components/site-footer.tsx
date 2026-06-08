"use client";

import { useTranslations } from "next-intl";

import { LanguageSwitcher } from "@/components/language-switcher";
import { Link } from "@/i18n/routing";
import { siteConfig } from "@/lib/config";
import { buildTelegramUrl, buildWhatsappUrl } from "@/lib/messenger";

const NAV_ITEMS = [
  { href: "/services", key: "services" },
  { href: "/cases", key: "cases" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;

export function SiteFooter() {
  const t = useTranslations("common");
  const meta = useTranslations("meta");

  const whatsappUrl = buildWhatsappUrl({ number: siteConfig.whatsapp });
  const telegramUrl = buildTelegramUrl({ username: siteConfig.telegram });

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

        <div className="flex flex-col gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("cta_whatsapp")}
          </a>
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("cta_telegram")}
          </a>
        </div>

        <div className="flex flex-col gap-3">
          <LanguageSwitcher />
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-muted-foreground">
          <p>
            © {year} {meta("site_name")}
          </p>
          <p>ИП / реквизиты — placeholder</p>
        </div>
      </div>
    </footer>
  );
}
