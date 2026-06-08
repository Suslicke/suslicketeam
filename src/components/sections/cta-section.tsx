import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { LeadForm } from "@/components/lead-form";
import { MessengerCTA } from "@/components/messenger-cta";
import { CtaGlow } from "@/components/motion/cta-glow";
import { Reveal } from "@/components/motion/reveal";

/**
 * Final conversion block. The strongest CTA on the page: a large headline, a
 * single clear value line, a compact proof row, both messenger channels given
 * prominent weight, then the lead form. Ambient brand glow behind it for depth.
 */
export async function CtaSection() {
  const t = await getTranslations("home.final_cta");
  const tc = await getTranslations("common");

  const proof = [t("proof_free"), t("proof_fast"), t("proof_fix")];

  return (
    <section className="relative isolate overflow-hidden border-t border-border/60 py-24 sm:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(70%_60%_at_50%_45%,color-mix(in_oklch,var(--brand)_20%,transparent),transparent_70%)]"
      />
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 text-center">
        <Reveal className="flex flex-col items-center gap-6">
          <h2 className="font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            {t("title")}
          </h2>
          <p className="max-w-xl text-lg text-pretty text-muted-foreground">
            {t("subtitle")}
          </p>

          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {proof.map((item) => (
              <li key={item} className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-brand" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <CtaGlow>
              <MessengerCTA
                channel="whatsapp"
                size="lg"
                className="h-12 bg-brand px-7 text-base text-brand-foreground hover:bg-brand/90"
                label={tc("cta_whatsapp")}
              />
            </CtaGlow>
            <MessengerCTA
              channel="telegram"
              variant="outline"
              size="lg"
              className="h-12 border-brand/40 px-7 text-base hover:border-brand/70 hover:text-brand"
              label={tc("cta_telegram")}
            />
          </div>

          <p className="max-w-md text-sm text-muted-foreground/80">{t("note")}</p>
        </Reveal>

        <Reveal className="mt-12 w-full max-w-xl text-left">
          <LeadForm />
        </Reveal>
      </div>
    </section>
  );
}
