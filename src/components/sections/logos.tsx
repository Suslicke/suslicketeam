import { getTranslations } from "next-intl/server";

import { Reveal } from "@/components/motion/reveal";
import { getFeaturedCases } from "@/lib/content";

/**
 * Trust strip — a tasteful, text-based wordmark row of the featured cases. Each
 * wordmark links out to the live project (new tab, `rel="noopener"`).
 */
export async function Logos() {
  const t = await getTranslations("home.logos");
  const tc = await getTranslations("cases");
  const featured = getFeaturedCases();

  return (
    <section className="border-b border-border/60 py-12">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal className="flex flex-col items-center gap-8">
          <p className="text-sm tracking-wide text-muted-foreground uppercase">
            {t("title")}
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
            {featured.map((c) => (
              <li key={c.slug}>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-display text-xl font-semibold text-muted-foreground/70 transition-colors hover:text-foreground"
                >
                  {tc(`${c.slug}.title`)}
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
