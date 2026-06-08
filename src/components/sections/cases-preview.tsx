import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { CaseCard } from "@/components/sections/case-card";
import { SectionHeading } from "@/components/sections/section-heading";
import { Link } from "@/i18n/routing";
import { getFeaturedCases } from "@/lib/content";

/**
 * Featured-case preview grid. Each card shows the title, tech tags, a one-line
 * result, a live link (new tab) and an internal link to the case detail page.
 */
export async function CasesPreview() {
  const t = await getTranslations("home.cases");
  const tc = await getTranslations("cases");
  const tcommon = await getTranslations("common");
  const featured = getFeaturedCases();

  return (
    <section className="border-t border-border/60 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
        />

        <Stagger className="mt-14 grid gap-5 sm:grid-cols-2">
          {featured.map((c) => (
            <StaggerItem as="li" key={c.slug}>
              <CaseCard
                slug={c.slug}
                title={tc(`${c.slug}.title`)}
                result={tc(`${c.slug}.result`)}
                tags={c.tags}
                year={c.year}
                url={c.url}
                detailsLabel={t("details")}
                liveLabel={t("live")}
                nda={c.nda}
                ndaLabel={tcommon("nda")}
              />
            </StaggerItem>
          ))}
        </Stagger>

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
