import type { Metadata } from "next";
import { Check } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Breadcrumbs } from "@/components/sections/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { MessengerCTA } from "@/components/messenger-cta";
import { PageCta } from "@/components/sections/page-cta";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/sections/section-heading";
import { PRICING_TIERS } from "@/content/pricing";
import { siteConfig, type Locale } from "@/lib/config";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd } from "@/lib/structured-data";
import { cn } from "@/lib/utils";

const TERM_KEYS = ["fixed", "prepay", "ownership", "range"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pricing" });

  return buildMetadata({
    locale: locale as Locale,
    path: "/pricing",
    title: t("meta_title"),
    description: t("meta_description"),
  });
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("pricing");
  const tc = await getTranslations("common");
  const fmt = new Intl.NumberFormat(locale === "en" ? "en" : "ru-RU");

  const base = `${siteConfig.url}/${locale}`;
  const breadcrumb = breadcrumbLd([
    { name: tc("breadcrumb_home"), url: base },
    { name: t("eyebrow"), url: `${base}/pricing` },
  ]);

  return (
    <main>
      <JsonLd data={breadcrumb} />

      <section className="pt-16 sm:pt-20">
        <div className="mx-auto max-w-6xl px-4">
          <Breadcrumbs
            items={[
              { href: "/", label: tc("breadcrumb_home") },
              { label: t("eyebrow") },
            ]}
          />
          <div className="mt-8">
            <SectionHeading
              align="left"
              eyebrow={t("eyebrow")}
              title={t("title")}
              subtitle={t("subtitle")}
            />
          </div>

          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PRICING_TIERS.map((tier, i) => {
              const features = t.raw(`tiers.${tier.slug}.features`) as string[];
              return (
                <Reveal as="li" key={tier.slug} delay={i * 0.06} className="flex">
                  <article
                    className={cn(
                      "flex w-full flex-col gap-5 rounded-2xl border bg-card/40 p-6",
                      tier.featured
                        ? "border-brand/60 shadow-[0_0_0_1px_color-mix(in_oklch,var(--brand)_40%,transparent)]"
                        : "border-border/60",
                    )}
                  >
                    <div>
                      <h2 className="font-display text-xl font-bold tracking-tight">
                        {t(`tiers.${tier.slug}.title`)}
                      </h2>
                      <p className="mt-2 text-sm text-pretty text-muted-foreground">
                        {t(`tiers.${tier.slug}.tagline`)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">{t("from")}</p>
                      <p className="font-display text-2xl font-bold tracking-tight">
                        {fmt.format(tier.kzt)} ₸
                        {tier.monthly ? (
                          <span className="text-base font-medium text-muted-foreground">
                            {" "}
                            {t("per_month")}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ≈ ${fmt.format(tier.usd)}
                        {tier.monthly ? ` ${t("per_month")}` : ""}
                      </p>
                    </div>

                    <ul className="flex flex-1 flex-col gap-2 text-sm">
                      {features.map((f) => (
                        <li key={f} className="flex gap-2">
                          <Check
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0 text-brand"
                          />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <MessengerCTA
                      channel="whatsapp"
                      variant={tier.featured ? "default" : "outline"}
                      className={cn(
                        "w-full",
                        tier.featured &&
                          "bg-brand text-brand-foreground hover:bg-brand/90",
                      )}
                      label={t("tier_cta")}
                    />
                  </article>
                </Reveal>
              );
            })}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">{t("usd_note")}</p>
        </div>
      </section>

      <section className="mt-16 sm:mt-20">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal>
            <div className="rounded-2xl border border-border/60 bg-card/40 p-8 sm:p-10">
              <h2 className="font-display text-2xl font-bold tracking-tight">
                {t("terms.title")}
              </h2>
              <ul className="mt-6 grid gap-5 sm:grid-cols-2">
                {TERM_KEYS.map((key) => (
                  <li key={key} className="flex flex-col gap-1">
                    <h3 className="font-semibold">{t(`terms.${key}.title`)}</h3>
                    <p className="text-sm text-pretty text-muted-foreground">
                      {t(`terms.${key}.body`)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <div className="mt-20 sm:mt-28">
        <PageCta title={t("cta_title")} subtitle={t("cta_subtitle")} />
      </div>
    </main>
  );
}
