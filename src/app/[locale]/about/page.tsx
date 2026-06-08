import {
  Boxes,
  Braces,
  Code2,
  Database,
  Palette,
  Smartphone,
  Sparkles,
  Workflow,
} from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Breadcrumbs } from "@/components/sections/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { PageCta } from "@/components/sections/page-cta";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/sections/section-heading";
import { siteConfig, type Locale } from "@/lib/config";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd, organizationLd, personLd } from "@/lib/structured-data";

// Tech stack: grouped by domain. Group titles are translated (aboutPage.stack_groups.*),
// while tech labels are brand/tech names rendered verbatim, so they live here.
const STACK_GROUPS = [
  {
    key: "web",
    items: [
      { icon: Code2, label: "Next.js" },
      { icon: Boxes, label: "React" },
      { icon: Braces, label: "TypeScript" },
      { icon: Palette, label: "Tailwind" },
    ],
  },
  {
    key: "backend",
    items: [
      { icon: Database, label: "Python" },
      { icon: Database, label: "Golang" },
    ],
  },
  {
    key: "mobile",
    items: [
      { icon: Smartphone, label: "Flutter" },
      { icon: Smartphone, label: "React Native" },
    ],
  },
  {
    key: "ai",
    items: [
      { icon: Sparkles, label: "AI / LLM" },
      { icon: Workflow, label: "n8n" },
      { icon: Workflow, label: "AI-agent pipelines" },
    ],
  },
] as const;

const FACT_KEYS = ["projects", "speed", "approach"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "aboutPage" });

  return buildMetadata({
    locale: locale as Locale,
    path: "/about",
    title: t("meta_title"),
    description: t("meta_description"),
  });
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("aboutPage");
  const tc = await getTranslations("common");

  const base = `${siteConfig.url}/${locale}`;
  const breadcrumb = breadcrumbLd([
    { name: tc("breadcrumb_home"), url: base },
    { name: t("eyebrow"), url: `${base}/about` },
  ]);

  return (
    <main>
      <JsonLd data={breadcrumb} />
      <JsonLd data={personLd()} />
      <JsonLd data={organizationLd()} />

      <section className="pt-16 sm:pt-20">
        <div className="mx-auto max-w-4xl px-4">
          <Breadcrumbs
            items={[
              { href: "/", label: tc("breadcrumb_home") },
              { label: t("eyebrow") },
            ]}
          />
          <div className="mt-8">
            <SectionHeading align="left" eyebrow={t("eyebrow")} title={t("title")} />
          </div>
        </div>
      </section>

      {/* Intro + avatar */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4">
          <Reveal className="flex flex-col items-start gap-8 sm:flex-row sm:items-center">
            {/* TODO: real photo — gradient initials avatar placeholder for now. */}
            <div
              aria-hidden="true"
              className="flex size-28 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand/40 font-display text-4xl font-bold text-brand-foreground ring-1 ring-foreground/10"
            >
              {t("avatar_initials")}
            </div>
            <div className="flex flex-col gap-3">
              <h2 className="font-display text-2xl font-bold tracking-tight">
                {t("intro_title")}
              </h2>
              <p className="text-pretty text-muted-foreground">{t("intro")}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Trust facts */}
      <section className="border-t border-border/60 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-2xl font-bold tracking-tight">
            {t("facts_title")}
          </h2>
          <ul className="mt-10 grid gap-5 sm:grid-cols-3">
            {FACT_KEYS.map((key, i) => (
              <Reveal as="li" key={key} delay={i * 0.06}>
                <div className="flex h-full flex-col gap-2 rounded-xl border border-border/60 bg-card/40 p-6">
                  <span className="font-display text-3xl font-bold text-brand">
                    {t(`facts.${key}.value`)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {t(`facts.${key}.label`)}
                  </span>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Tech stack */}
      <section className="border-t border-border/60 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-2xl font-bold tracking-tight">
            {t("stack_title")}
          </h2>
          <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">
            {t("stack_subtitle")}
          </p>
          <div className="mt-10 flex flex-col gap-10">
            {STACK_GROUPS.map((group) => (
              <div key={group.key}>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {t(`stack_groups.${group.key}`)}
                </h3>
                <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {group.items.map(({ icon: Icon, label }, i) => (
                    <Reveal as="li" key={label} delay={i * 0.04}>
                      <div className="flex h-full flex-col items-center gap-3 rounded-xl border border-border/60 bg-card/40 p-5 text-center">
                        <span className="flex size-11 items-center justify-center rounded-lg bg-brand/10 text-brand">
                          <Icon className="size-5" />
                        </span>
                        <span className="text-sm font-medium">{label}</span>
                      </div>
                    </Reveal>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-8 max-w-2xl text-pretty font-medium">
            {t("stack_automation")}
          </p>
        </div>
      </section>

      {/* Team blurb */}
      <section className="border-t border-border/60 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4">
          <Reveal className="flex flex-col gap-4">
            <h2 className="font-display text-2xl font-bold tracking-tight">
              {t("team_title")}
            </h2>
            <p className="text-pretty text-muted-foreground">{t("team")}</p>
          </Reveal>
        </div>
      </section>

      <PageCta title={t("cta_title")} subtitle={t("cta_subtitle")} />
    </main>
  );
}
