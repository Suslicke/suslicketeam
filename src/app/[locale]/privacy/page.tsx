// Template — have a lawyer review before relying on it.
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Breadcrumbs } from "@/components/sections/breadcrumbs";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/sections/section-heading";
import { type Locale } from "@/lib/config";
import { buildMetadata } from "@/lib/seo";

const SECTION_KEYS = [
  "data",
  "analytics",
  "use",
  "rights",
  "contact",
  "law",
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });

  return buildMetadata({
    locale: locale as Locale,
    path: "/privacy",
    title: t("meta_title"),
    description: t("meta_description"),
  });
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("privacy");
  const tc = await getTranslations("common");

  return (
    <main>
      <section className="pt-16 sm:pt-20">
        <div className="mx-auto max-w-3xl px-4">
          <Breadcrumbs
            items={[
              { href: "/", label: tc("breadcrumb_home") },
              { label: t("title") },
            ]}
          />
          <div className="mt-8">
            <SectionHeading
              align="left"
              eyebrow={t("eyebrow")}
              title={t("title")}
              subtitle={t("intro")}
            />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{t("updated")}</p>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="mx-auto flex max-w-3xl flex-col gap-10 px-4">
          {SECTION_KEYS.map((key, i) => (
            <Reveal key={key} delay={i * 0.04} className="flex flex-col gap-3">
              <h2 className="font-display text-xl font-bold tracking-tight">
                {t(`sections.${key}.title`)}
              </h2>
              <p className="text-pretty text-muted-foreground">
                {t(`sections.${key}.body`)}
              </p>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}
