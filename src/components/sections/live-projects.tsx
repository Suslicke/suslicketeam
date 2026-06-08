import { ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/sections/section-heading";
import { Card } from "@/components/ui/card";
import type { CaseSlug } from "@/content/cases";
import { getCases } from "@/lib/content";

/**
 * Readable display names per case slug. The structural `slug` stays the routing
 * key; this is just the human-facing label shown in the verify-it-yourself grid.
 */
const DISPLAY_NAMES: Record<CaseSlug, string> = {
  suslicke: "suslicke.com",
  animeenigma: "AnimeEnigma",
  xaid: "xaid.ai",
  "python-guide": "Python Guide",
  "web-interview": "Web Interview",
  loyrush: "LoyRush",
  "exchange-bridge": "Exchange Bridge",
  "ai-diagnostic": "AI Diagnostic",
};

/**
 * Honest social proof: a dense grid of every live project the visitor can open
 * and verify. No quotes, no logos — just real, running sites with their launch
 * year and an external "open site" link. Deliberately distinct from the curated
 * `cases-preview` (featured only) and the `logos` strip.
 */
export async function LiveProjects() {
  const t = await getTranslations("home.liveProjects");
  const projects = getCases();

  return (
    <section className="border-t border-border/60 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
        />

        <ul className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {projects.map((project, i) => (
            <Reveal as="li" key={project.slug} delay={i * 0.04}>
              <Card className="h-full gap-3 p-5 transition-all hover:-translate-y-1 hover:ring-brand/40">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-base font-semibold text-balance">
                    {DISPLAY_NAMES[project.slug]}
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
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
