import { getTranslations } from "next-intl/server";

import { ConstellationMount } from "@/components/hero/constellation-mount";
import { MessengerCTA } from "@/components/messenger-cta";

/**
 * Home hero. Rendered as a Server Component so the headline + CTAs are present in
 * the initial HTML (the headline is the LCP element). The animated constellation
 * is mounted client-side behind the content via `ConstellationMount` and never
 * blocks first paint.
 *
 * Headline options (RU) — see `home.hero.headline` / `home.hero.headline_alt`:
 *   1. "Сайты и веб-приложения, которые приносят клиентов"  ← default
 *   2. "Превращаем идеи в digital-продукты, которые продают"
 */
export async function Hero() {
  const t = await getTranslations("home.hero");

  return (
    <section className="relative isolate overflow-hidden border-b border-border/60">
      {/* Soft brand glow + animated constellation, both behind content. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklch,var(--brand)_18%,transparent),transparent_70%)]"
      />
      <ConstellationMount />

      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 py-24 text-center sm:py-32 lg:py-40">
        <span className="inline-flex items-center rounded-full border border-border/70 bg-background/40 px-3 py-1 text-xs font-medium tracking-wide text-muted-foreground backdrop-blur-sm">
          {t("eyebrow")}
        </span>

        <h1 className="font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
          {t("headline")}
        </h1>

        <p className="max-w-2xl text-lg text-pretty text-muted-foreground sm:text-xl">
          {t("subhead")}
        </p>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <MessengerCTA
            channel="whatsapp"
            size="lg"
            className="h-11 bg-brand px-6 text-base text-brand-foreground hover:bg-brand/90"
            label={t("cta_primary")}
          />
          <MessengerCTA
            channel="telegram"
            variant="outline"
            size="lg"
            className="h-11 px-6 text-base"
            label={t("cta_secondary")}
          />
        </div>

        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          {t("trust")}
        </p>
      </div>
    </section>
  );
}
