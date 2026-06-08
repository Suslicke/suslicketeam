import { Quote } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/sections/section-heading";
import { Card } from "@/components/ui/card";

// TODO: replace with real testimonials. These are clearly-marked samples with
// role-based attributions (no fabricated named clients). See `home.testimonials`.
const ITEMS = ["one", "two", "three"] as const;

export async function Testimonials() {
  const t = await getTranslations("home.testimonials");
  const ti = await getTranslations("testimonials");

  return (
    <section className="border-t border-border/60 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
        />

        <ul className="mt-14 grid gap-5 lg:grid-cols-3">
          {ITEMS.map((item, i) => (
            <Reveal as="li" key={item} delay={i * 0.06}>
              <Card className="flex h-full flex-col gap-5 p-6">
                <Quote className="size-6 text-brand/70" aria-hidden="true" />
                <p className="flex-1 text-pretty">
                  {ti(`items.${item}.quote`)}
                </p>
                <div className="text-sm">
                  <p className="font-medium">{ti(`items.${item}.author`)}</p>
                  <p className="text-muted-foreground">
                    {ti(`items.${item}.role`)}
                  </p>
                </div>
              </Card>
            </Reveal>
          ))}
        </ul>

        <p className="mt-6 text-center text-xs text-muted-foreground/70">
          {t("disclaimer")}
        </p>
      </div>
    </section>
  );
}
