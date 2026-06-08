import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Breadcrumbs } from "@/components/sections/breadcrumbs";
import { CaseCard } from "@/components/sections/case-card";
import { JsonLd } from "@/components/json-ld";
import { PageCta } from "@/components/sections/page-cta";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/sections/section-heading";
import { siteConfig, type Locale } from "@/lib/config";
import { getCases } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd } from "@/lib/structured-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "casesPage" });

  return buildMetadata({
    locale: locale as Locale,
    path: "/cases",
    title: t("meta_title"),
    description: t("meta_description"),
  });
}

export default async function CasesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("casesPage");
  const tc = await getTranslations("common");
  const tcase = await getTranslations("cases");
  const cases = getCases();

  const base = `${siteConfig.url}/${locale}`;
  const breadcrumb = breadcrumbLd([
    { name: tc("breadcrumb_home"), url: base },
    { name: t("eyebrow"), url: `${base}/cases` },
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
            {cases.map((c, i) => (
              <Reveal as="li" key={c.slug} delay={i * 0.05}>
                <CaseCard
                  slug={c.slug}
                  title={tcase(`${c.slug}.title`)}
                  result={tcase(`${c.slug}.result`)}
                  tags={c.tags}
                  year={c.year}
                  url={c.url}
                  detailsLabel={t("details")}
                  liveLabel={t("live")}
                  nda={c.nda}
                  ndaLabel={tc("nda")}
                />
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <div className="mt-20 sm:mt-28">
        <PageCta title={t("cta_title")} subtitle={t("cta_subtitle")} />
      </div>
    </main>
  );
}
