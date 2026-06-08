import { ArrowRight, ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/sections/section-heading";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { getFeaturedCases } from "@/lib/content";

/**
 * Featured-case preview grid. Each card shows the title, tech tags, a one-line
 * result, a live link (new tab) and an internal link to the case detail page.
 */
export async function CasesPreview() {
  const t = await getTranslations("home.cases");
  const tc = await getTranslations("cases");
  const featured = getFeaturedCases();

  return (
    <section className="border-t border-border/60 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
        />

        <ul className="mt-14 grid gap-5 sm:grid-cols-2">
          {featured.map((c, i) => (
            <Reveal as="li" key={c.slug} delay={i * 0.06}>
              <Card className="h-full gap-4 p-6 transition-all hover:-translate-y-1 hover:ring-brand/40">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-display text-xl font-semibold">
                    {tc(`${c.slug}.title`)}
                  </h3>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {c.year}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground">
                  {tc(`${c.slug}.result`)}
                </p>

                <ul className="flex flex-wrap gap-2">
                  {c.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-border/70 px-2.5 py-0.5 text-xs text-muted-foreground"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto flex items-center gap-4 pt-2 text-sm font-medium">
                  <Link
                    href={`/cases/${c.slug}`}
                    className="inline-flex items-center gap-1 text-brand hover:underline"
                  >
                    {t("details")}
                    <ArrowRight className="size-4" />
                  </Link>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    {t("live")}
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              </Card>
            </Reveal>
          ))}
        </ul>

        <Reveal className="mt-12 flex justify-center">
          <Link
            href="/cases"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-brand"
          >
            {t("cta")}
            <ArrowRight className="size-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
