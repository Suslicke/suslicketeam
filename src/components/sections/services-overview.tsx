import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/sections/section-heading";
import { iconMap } from "@/components/sections/icon-map";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { getServices } from "@/lib/content";

/**
 * Grid of the five service offerings. Each card links to its detail page and
 * pulls localized copy from the `services` namespace keyed by slug.
 */
export async function ServicesOverview() {
  const t = await getTranslations("home.services");
  const ts = await getTranslations("services");
  const services = getServices();

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
        />

        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => {
            const Icon = iconMap[service.icon] ?? ArrowRight;
            return (
              <Reveal as="li" key={service.slug} delay={i * 0.06}>
                <Link
                  href={`/services/${service.slug}`}
                  className="block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <Card className="h-full gap-3 p-6 transition-all hover:-translate-y-1 hover:ring-brand/40">
                    <div className="flex size-11 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Icon className="size-5" />
                    </div>
                    <CardHeader className="gap-1.5 px-0">
                      <CardTitle className="font-display text-lg">
                        {ts(`${service.slug}.title`)}
                      </CardTitle>
                      <CardDescription>
                        {ts(`${service.slug}.tagline`)}
                      </CardDescription>
                    </CardHeader>
                    <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-brand">
                      {t("cta")}
                      <ArrowRight className="size-4 transition-transform group-hover/card:translate-x-0.5" />
                    </span>
                  </Card>
                </Link>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
