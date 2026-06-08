"use client";

import { Menu } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link } from "@/i18n/routing";
import { siteConfig } from "@/lib/config";
import { buildWhatsappUrl } from "@/lib/messenger";

const NAV_ITEMS = [
  { href: "/services", key: "services" },
  { href: "/cases", key: "cases" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;

export function SiteHeader() {
  const t = useTranslations("common");
  const meta = useTranslations("meta");
  const locale = useLocale();

  const whatsappUrl = buildWhatsappUrl({ number: siteConfig.whatsapp });

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="font-display text-lg font-bold tracking-tight"
        >
          {meta("site_name")}
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher className="hidden sm:inline-flex" />
          <ThemeToggle />
          <Button
            asChild
            className="hidden bg-brand text-brand-foreground hover:bg-brand/90 sm:inline-flex"
            size="lg"
          >
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              {t("cta_whatsapp")}
            </a>
          </Button>

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="md:hidden"
                aria-label="Open menu"
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle lang={locale}>{meta("site_name")}</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4">
                {NAV_ITEMS.map((item) => (
                  <SheetClose asChild key={item.key}>
                    <Link
                      href={item.href}
                      className="rounded-md px-2 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      {t(item.key)}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              <div className="mt-4 flex flex-col gap-4 px-4">
                <LanguageSwitcher />
                <SheetClose asChild>
                  <Button
                    asChild
                    className="bg-brand text-brand-foreground hover:bg-brand/90"
                  >
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t("cta_whatsapp")}
                    </a>
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
