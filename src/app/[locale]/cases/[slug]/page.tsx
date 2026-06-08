import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Breadcrumbs } from "@/components/sections/breadcrumbs";
import { CaseCard } from "@/components/sections/case-card";
import { JsonLd } from "@/components/json-ld";
import { PageCta } from "@/components/sections/page-cta";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { routing } from "@/i18n/routing";
import { siteConfig, type Locale } from "@/lib/config";
import { getCaseBySlug, getCases } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd, creativeWorkLd } from "@/lib/structured-data";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getCases().map((c) => ({ locale, slug: c.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const item = getCaseBySlug(slug);
  if (!item) return {};

  const tcase = await getTranslations({ locale, namespace: "cases" });

  return buildMetadata({
    locale: locale as Locale,
    path: `/cases/${slug}`,
    title: tcase(`${slug}.title`),
    description: tcase(`${slug}.summary`),
  });
}

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const item = getCaseBySlug(slug);
  if (!item) notFound();

  const tcase = await getTranslations("cases");
  const td = await getTranslations("caseDetail");
  const tc = await getTranslations("common");
  const tcp = await getTranslations("casesPage");

  // Up to 3 other cases for the "more cases" rail.
  const others = getCases().filter((c) => c.slug !== slug).slice(0, 3);

  const base = `${siteConfig.url}/${locale}`;
  const url = `${base}/cases/${slug}`;

  const breadcrumb = breadcrumbLd([
    { name: tc("breadcrumb_home"), url: base },
    { name: td("breadcrumb_label"), url: `${base}/cases` },
    { name: tcase(`${slug}.title`), url },
  ]);

  const creativeWork = creativeWorkLd({
    name: tcase(`${slug}.title`),
    description: tcase(`${slug}.summary`),
    url,
    about: item.url,
    keywords: item.tags,
    year: item.year,
  });

  const narrative = [
    { key: "task", title: td("task_title"), body: tcase(`${slug}.task`) },
    { key: "solution", title: td("solution_title"), body: tcase(`${slug}.solution`) },
    { key: "result", title: td("result_title"), body: tcase(`${slug}.result`) },
  ] as const;

  return (
    <main>
      <JsonLd data={breadcrumb} />
      <JsonLd data={creativeWork} />

      <section className="pt-16 sm:pt-20">
        <div className="mx-auto max-w-4xl px-4">
          <Breadcrumbs
            items={[
              { href: "/", label: tc("breadcrumb_home") },
              { href: "/cases", label: td("breadcrumb_label") },
              { label: tcase(`${slug}.title`) },
            ]}
          />

          <Reveal className="mt-8 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{item.year}</span>
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              {tcase(`${slug}.title`)}
            </h1>
            <p className="max-w-2xl text-pretty text-lg text-muted-foreground">
              {tcase(`${slug}.summary`)}
            </p>

            <ul className="flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-border/70 px-2.5 py-0.5 text-xs text-muted-foreground"
                >
                  {tag}
                </li>
              ))}
            </ul>

            <div>
              <Button
                asChild
                className="h-11 bg-brand px-6 text-base text-brand-foreground hover:bg-brand/90"
              >
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-live-link
                >
                  {td("live_button")}
                  <ExternalLink className="size-4" />
                </a>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Task -> Solution -> Result narrative */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4">
          <div className="grid gap-10">
            {narrative.map((block, i) => (
              <Reveal key={block.key} delay={i * 0.06}>
                <div className="flex flex-col gap-3 border-l-2 border-brand/40 pl-6">
                  <h2 className="font-display text-sm font-semibold tracking-wide text-brand uppercase">
                    {block.title}
                  </h2>
                  <p className="text-pretty text-muted-foreground">{block.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Technologies */}
      <section className="border-t border-border/60 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="font-display text-2xl font-bold tracking-tight">
            {td("tech_title")}
          </h2>
          <ul className="mt-6 flex flex-wrap gap-2.5">
            {tcase(`${slug}.technologies`)
              .split(",")
              .map((tech) => tech.trim())
              .filter(Boolean)
              .map((tech) => (
                <li
                  key={tech}
                  className="rounded-lg border border-border/60 bg-card/40 px-3 py-1.5 text-sm text-muted-foreground"
                >
                  {tech}
                </li>
              ))}
          </ul>
        </div>
      </section>

      {/* More cases */}
      {others.length > 0 ? (
        <section className="border-t border-border/60 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="font-display text-2xl font-bold tracking-tight">
              {td("more_title")}
            </h2>
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((c, i) => (
                <Reveal as="li" key={c.slug} delay={i * 0.06}>
                  <CaseCard
                    slug={c.slug}
                    title={tcase(`${c.slug}.title`)}
                    result={tcase(`${c.slug}.result`)}
                    tags={c.tags}
                    year={c.year}
                    url={c.url}
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
