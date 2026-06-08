import { ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { SectionHeading } from "@/components/sections/section-heading";
import { Card } from "@/components/ui/card";
import { CASE_DISPLAY_NAMES } from "@/content/cases";
import { getPublicCases } from "@/lib/content";

/**
 * Honest social proof: a dense grid of every live project the visitor can open
 * and verify. No quotes, no logos — just real, running sites with their launch
 * year and an external "open site" link. Deliberately distinct from the curated
 * `cases-preview` (featured only) and the `logos` strip.
 */
export async function LiveProjects() {
  const t = await getTranslations("home.liveProjects");
  const projects = getPublicCases();

  return (
    <section className="border-t border-border/60 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
        />

        <Stagger className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {projects.map((project) => (
            <StaggerItem as="li" key={project.slug}>
              <Card className="h-full gap-3 p-5 transition-all hover:-translate-y-1 hover:ring-brand/40">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-base font-semibold text-balance">
                    {CASE_DISPLAY_NAMES[project.slug]}
                  </h3>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {project.year}
                  </span>
                </div>

                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
                >
                  {t("open")}
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                </a>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
