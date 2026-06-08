import { Gauge, Headset, Search, ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/sections/section-heading";

const BENEFITS = [
  { key: "speed", Icon: Gauge },
  { key: "seo", Icon: Search },
  { key: "support", Icon: Headset },
  { key: "transparency", Icon: ShieldCheck },
] as const;

/**
 * Benefit grid — why work with the studio. Copy lives under `home.why.items.<key>`.
 */
export async function WhyUs() {
  const t = await getTranslations("home.why");

  return (
    <section className="border-t border-border/60 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
        />

        <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map(({ key, Icon }, i) => (
            <Reveal as="li" key={key} delay={i * 0.06}>
              <div className="flex h-full flex-col gap-3 rounded-xl border border-border/60 bg-card/40 p-6">
                <div className="flex size-11 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <Icon className="size-5" />
                </div>
                <h3 className="font-display text-lg font-semibold">
                  {t(`items.${key}.title`)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t(`items.${key}.description`)}
                </p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
