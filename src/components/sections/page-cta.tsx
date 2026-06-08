import { getTranslations } from "next-intl/server";

import { MessengerCTA } from "@/components/messenger-cta";
import { Reveal } from "@/components/motion/reveal";

export interface PageCtaProps {
  title: string;
  subtitle: string;
}

/**
 * Reusable final conversion block for inner pages. Mirrors the home page's
 * CtaSection visuals (radial brand glow, centered copy, both messenger
 * channels) but takes its title/subtitle from the caller so each page can speak
 * to its own context.
 */
export async function PageCta({ title, subtitle }: PageCtaProps) {
  const tc = await getTranslations("common");

  return (
    <section className="relative isolate overflow-hidden border-t border-border/60 py-24 sm:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_50%,color-mix(in_oklch,var(--brand)_16%,transparent),transparent_70%)]"
      />
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 text-center">
        <Reveal className="flex flex-col items-center gap-6">
          <h2 className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            {title}
          </h2>
          <p className="max-w-xl text-pretty text-muted-foreground">{subtitle}</p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <MessengerCTA
              channel="whatsapp"
              size="lg"
              className="h-11 bg-brand px-6 text-base text-brand-foreground hover:bg-brand/90"
              label={tc("cta_whatsapp")}
            />
            <MessengerCTA
              channel="telegram"
              variant="outline"
              size="lg"
              className="h-11 px-6 text-base"
              label={tc("cta_telegram")}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
