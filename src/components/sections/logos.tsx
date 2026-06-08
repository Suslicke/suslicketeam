import { getTranslations } from "next-intl/server";

import { Marquee } from "@/components/sections/marquee";
import { Reveal } from "@/components/motion/reveal";
import { CASE_DISPLAY_NAMES } from "@/content/cases";
import { getCases } from "@/lib/content";

/**
 * Trust strip — a subtle, continuously-scrolling marquee of every live project
 * wordmark. Distinct from the `live-projects` grid (which is the verifiable,
 * linked card grid); this is a low-key brand-muted ribbon for at-a-glance proof
 * of breadth. CSS-only scroll, pauses on hover, static under reduced motion.
 */
export async function Logos() {
  const t = await getTranslations("home.logos");
  const projects = getCases();
  const names = projects.map((c) => CASE_DISPLAY_NAMES[c.slug]);

  return (
    <section className="border-b border-border/60 py-12">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal className="flex flex-col items-center gap-8">
          <p className="text-sm tracking-wide text-muted-foreground uppercase">
            {t("title")}
          </p>
          <Marquee items={names} className="w-full" />
        </Reveal>
      </div>
    </section>
  );
}
