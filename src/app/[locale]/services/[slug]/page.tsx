import { ArrowRight, Check } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Breadcrumbs } from "@/components/sections/breadcrumbs";
import { CaseCard } from "@/components/sections/case-card";
import { JsonLd } from "@/components/json-ld";
import { PageCta } from "@/components/sections/page-cta";
import { Reveal } from "@/components/motion/reveal";
import { iconMap } from "@/components/sections/icon-map";
import { routing } from "@/i18n/routing";
import { siteConfig, type Locale } from "@/lib/config";
import { getCaseBySlug, getServiceBySlug, getServices } from "@/lib/content";
import type { CaseSlug } from "@/content/cases";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd, serviceLd } from "@/lib/structured-data";

const BENEFIT_KEYS = ["one", "two", "three", "four"] as const;
const PROCESS_STEPS = ["discovery", "design", "build", "launch"] as const;

/**
 * Explicit, curated mapping of each service to the portfolio cases that best
 * represent it. Slugs are resolved via `getCaseBySlug`; missing slugs are
 * filtered out and the list is capped on render. May include NDA cases —
 * CaseCard renders them without a live link.
 */
const RELEVANT_CASES: Record<string, readonly CaseSlug[]> = {
  landing: ["nda-furniture", "scioffice", "suslicke", "python-guide", "web-interview"],
  "web-apps": [
    "xaid",
    "loyrush",
    "exchange-bridge",
    "ai-diagnostic",
    "animeenigma",
    "nda-school",
    "scioffice",
  ],
  ai: ["xaid", "ai-diagnostic"],
  mobile: ["loyrush"],
  seo: [
    "suslicke",
    "python-guide",
    "web-interview",
    "exchange-bridge",
    "loyrush",
    "xaid",
    "animeenigma",
    "ai-diagnostic",
    "scioffice",
  ],
};

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getServices().map((service) => ({ locale, slug: service.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return {};

  const ts = await getTranslations({ locale, namespace: "services" });

  return buildMetadata({
    locale: locale as Locale,
    path: `/services/${slug}`,
    title: ts(`${slug}.title`),
    description: ts(`${slug}.description`),
  });
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const service = getServiceBySlug(slug);
  if (!service) notFound();

  const ts = await getTranslations("services");
  const td = await getTranslations("serviceDetail");
  const tc = await getTranslations("common");
  const tcase = await getTranslations("cases");
  const tcp = await getTranslations("casesPage");
  const tp = await getTranslations("home.process");

  const Icon = iconMap[service.icon] ?? ArrowRight;

  // Relevant cases from an explicit curated map (capped at 3 for a focused section).
  const relevant = (RELEVANT_CASES[slug] ?? [])
    .map((caseSlug) => getCaseBySlug(caseSlug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .slice(0, 3);

  const base = `${siteConfig.url}/${locale}`;
  const url = `${base}/services/${slug}`;

  const breadcrumb = breadcrumbLd([
    { name: tc("breadcrumb_home"), url: base },
    { name: td("breadcrumb_label"), url: `${base}/services` },
    { name: ts(`${slug}.title`), url },
  ]);

  const service_ld = serviceLd({
    name: ts(`${slug}.title`),
    description: ts(`${slug}.description`),
    url,
  });

  return (
    <main>
      <JsonLd data={breadcrumb} />
      <JsonLd data={service_ld} />

      <section className="pt-16 sm:pt-20">
        <div className="mx-auto max-w-4xl px-4">
          <Breadcrumbs
            items={[
              { href: "/", label: tc("breadcrumb_home") },
              { href: "/services", label: td("breadcrumb_label") },
              { label: ts(`${slug}.title`) },
            ]}
          />

          <Reveal className="mt-8 flex flex-col gap-5">
            <div className="flex size-14 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Icon className="size-7" />
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              {ts(`${slug}.title`)}
            </h1>
            <p className="text-lg text-brand">{ts(`${slug}.tagline`)}</p>
            <p className="max-w-2xl text-pretty text-muted-foreground">
              {td(`intro.${slug}`)}
            </p>
          </Reveal>
        </div>
      </section>

      {/* What's included */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="font-display text-2xl font-bold tracking-tight">
            {td("included_title")}
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {BENEFIT_KEYS.map((key, i) => (
              <Reveal as="li" key={key} delay={i * 0.05}>
                <div className="flex h-full items-start gap-3 rounded-xl border border-border/60 bg-card/40 p-5">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-brand/10 text-brand">
                    <Check className="size-4" />
                  </span>
                  <p className="text-sm text-muted-foreground">
                    {td(`benefits.${slug}.${key}`)}
                  </p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Process */}
      <section className="border-t border-border/60 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-2xl font-bold tracking-tight">
            {td("process_title")}
          </h2>
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS_STEPS.map((step, i) => (
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
                    {tp(`steps.${step}.title`)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {tp(`steps.${step}.description`)}
                  </p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Relevant cases */}
      {relevant.length > 0 ? (
        <section className="border-t border-border/60 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="font-display text-2xl font-bold tracking-tight">
              {td("cases_title")}
            </h2>
            <ul className="mt-10 grid gap-5 sm:grid-cols-2">
              {relevant.map((c, i) => (
                <Reveal as="li" key={c.slug} delay={i * 0.06}>
                  <CaseCard
                    slug={c.slug}
                    title={tcase(`${c.slug}.title`)}
                    result={tcase(`${c.slug}.result`)}
                    tags={c.tags}
                    year={c.year}
                    url={c.url}
                    nda={c.nda}
                    ndaLabel={tc("nda")}
                    detailsLabel={tcp("details")}
                    liveLabel={tcp("live")}
                  />
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <PageCta title={td("cta_title")} subtitle={td("cta_subtitle")} />
    </main>
  );
}
