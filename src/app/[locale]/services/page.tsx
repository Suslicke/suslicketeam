import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Breadcrumbs } from "@/components/sections/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { PageCta } from "@/components/sections/page-cta";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/sections/section-heading";
import { ServiceCard } from "@/components/sections/service-card";
import { siteConfig, type Locale } from "@/lib/config";
import { getServices } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd } from "@/lib/structured-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "servicesPage" });

  return buildMetadata({
    locale: locale as Locale,
    path: "/services",
    title: t("meta_title"),
    description: t("meta_description"),
  });
}

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("servicesPage");
  const ts = await getTranslations("services");
  const tc = await getTranslations("common");
  const services = getServices();

  const base = `${siteConfig.url}/${locale}`;
  const breadcrumb = breadcrumbLd([
    { name: tc("breadcrumb_home"), url: base },
    { name: t("eyebrow"), url: `${base}/services` },
  ]);

  return (
    <main>
      <JsonLd data={breadcrumb} />

      <section className="pt-16 sm:pt-20">
        <div className="mx-auto max-w-6xl px-4">
          <Breadcrumbs
            items={[
              { href: "/", label: tc("breadcrumb_home") },
              { label: t("eyebrow") },
            ]}
          />
          <div className="mt-8">
            <SectionHeading
              align="left"
              eyebrow={t("eyebrow")}
              title={t("title")}
              subtitle={t("subtitle")}
            />
          </div>

          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, i) => (
              <Reveal as="li" key={service.slug} delay={i * 0.06}>
                <ServiceCard
                  slug={service.slug}
                  icon={service.icon}
                  title={ts(`${service.slug}.title`)}
                  tagline={ts(`${service.slug}.tagline`)}
                  cta={t("card_cta")}
                />
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-16 sm:mt-20">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal>
            <div className="rounded-2xl border border-border/60 bg-card/40 p-8 text-center sm:p-10">
              <h2 className="font-display text-2xl font-bold tracking-tight">
                {t("any_project_title")}
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-pretty text-muted-foreground">
                {t("any_project_text")}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <div className="mt-20 sm:mt-28">
        <PageCta title={t("cta_title")} subtitle={t("cta_subtitle")} />
      </div>
    </main>
  );
}
