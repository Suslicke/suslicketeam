import { getTranslations } from "next-intl/server";

import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { SectionHeading } from "@/components/sections/section-heading";
import { ServiceCard } from "@/components/sections/service-card";
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

        <Stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <StaggerItem as="li" key={service.slug}>
              <ServiceCard
                slug={service.slug}
                icon={service.icon}
                title={ts(`${service.slug}.title`)}
                tagline={ts(`${service.slug}.tagline`)}
                cta={t("cta")}
              />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
