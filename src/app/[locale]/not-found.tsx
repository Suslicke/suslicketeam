import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/routing";
import { MessengerCTA } from "@/components/messenger-cta";
import { Button } from "@/components/ui/button";

/**
 * Localized, branded 404. Rendered for `notFound()` calls inside the
 * `[locale]` segment, so translations and the locale-aware <Link> are available.
 */
export default async function LocaleNotFound() {
  const t = await getTranslations("errors");
  const tc = await getTranslations("common");

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-24">
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6 text-center">
        <p className="font-display text-6xl font-bold text-brand">404</p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-balance sm:text-3xl">
          {t("notFound_title")}
        </h1>
        <p className="max-w-md text-pretty text-muted-foreground">
          {t("notFound_message")}
        </p>

        <Button asChild size="lg" className="h-11 px-6 text-base">
          <Link href="/">{t("home")}</Link>
        </Button>

        <div className="mt-4 flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground">{t("cta_hint")}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <MessengerCTA
              channel="whatsapp"
              className="bg-brand text-brand-foreground hover:bg-brand/90"
              label={tc("cta_whatsapp")}
            />
            <MessengerCTA
              channel="telegram"
              variant="outline"
              label={tc("cta_telegram")}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
