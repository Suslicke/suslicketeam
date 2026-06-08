// Template — have a lawyer review before relying on it.
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Breadcrumbs } from "@/components/sections/breadcrumbs";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/sections/section-heading";
import { type Locale } from "@/lib/config";
import { buildMetadata } from "@/lib/seo";

const SECTION_KEYS = [
  "scope",
  "pricing",
  "rights",
  "content",
  "law",
  "contact",
] as const;

// Registered-entity requisites rendered as a definition list. Keys map to the
// `terms.requisites` message group (label + value pairs).
const REQUISITE_ROWS = [
  { label: "legal_name_label", value: "legal_name" },
  { label: "id_label", value: "id" },
  { label: "reg_date_label", value: "reg_date" },
  { label: "address_label", value: "address" },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms" });

  return buildMetadata({
    locale: locale as Locale,
    path: "/terms",
    title: t("meta_title"),
    description: t("meta_description"),
  });
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("terms");
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

          <Reveal
            delay={SECTION_KEYS.length * 0.04}
            className="flex flex-col gap-3"
          >
            <h2 className="font-display text-xl font-bold tracking-tight">
              {t("requisites.title")}
            </h2>
            <p className="text-pretty text-muted-foreground">
              {t("requisites.intro")}
            </p>
            <dl className="mt-2 grid gap-x-6 gap-y-3 rounded-lg border border-border bg-muted/30 p-5 sm:grid-cols-[max-content_1fr]">
              {REQUISITE_ROWS.map((row) => (
                <div key={row.value} className="contents">
                  <dt className="text-sm font-medium text-muted-foreground">
                    {t(`requisites.${row.label}`)}
                  </dt>
                  <dd className="text-sm text-foreground">
                    {t(`requisites.${row.value}`)}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="text-pretty text-sm text-muted-foreground">
              {t("requisites.note")}
            </p>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
