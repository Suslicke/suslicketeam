import { getTranslations } from "next-intl/server";

import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/sections/section-heading";

const STEPS = ["discovery", "design", "build", "launch"] as const;

/**
 * "How we work" — a numbered timeline of the engagement stages. Copy lives under
 * `home.process.steps.<key>`.
 */
export async function Process() {
  const t = await getTranslations("home.process");

  return (
    <section className="border-t border-border/60 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
        />

        <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <Reveal as="li" key={step} delay={i * 0.08}>
              <div className="flex h-full flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-brand/10 font-display text-sm font-bold text-brand">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    aria-hidden="true"
                    className="h-px flex-1 bg-gradient-to-r from-border to-transparent"
                  />
                </div>
                <h3 className="font-display text-lg font-semibold">
                  {t(`steps.${step}.title`)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t(`steps.${step}.description`)}
                </p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
