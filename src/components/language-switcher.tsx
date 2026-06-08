"use client";

import { useLocale } from "next-intl";

import { usePathname, useRouter } from "@/i18n/routing";
import { siteConfig, type Locale } from "@/lib/config";
import { cn } from "@/lib/utils";

const LOCALE_LABELS: Record<Locale, string> = {
  ru: "RU",
  kk: "KK",
  en: "EN",
};

export function LanguageSwitcher({ className }: { className?: string }) {
  const activeLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div
      className={cn("inline-flex items-center gap-1", className)}
      role="group"
      aria-label="Language"
    >
      {siteConfig.locales.map((locale) => {
        const isActive = locale === activeLocale;
        return (
          <button
            key={locale}
            type="button"
            lang={locale}
            aria-current={isActive ? "true" : undefined}
            onClick={() => router.replace(pathname, { locale })}
            className={cn(
              "rounded-md px-2 py-1 text-xs font-medium transition-colors",
              isActive
                ? "bg-brand text-brand-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {LOCALE_LABELS[locale]}
          </button>
        );
      })}
    </div>
  );
}
