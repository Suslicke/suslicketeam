import { Clock, MapPin } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Breadcrumbs } from "@/components/sections/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { MessengerCTA } from "@/components/messenger-cta";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/sections/section-heading";
import { siteConfig, type Locale } from "@/lib/config";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd } from "@/lib/structured-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contactPage" });

  return buildMetadata({
    locale: locale as Locale,
    path: "/contact",
    title: t("meta_title"),
    description: t("meta_description"),
  });
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("contactPage");
  const tc = await getTranslations("common");

  const base = `${siteConfig.url}/${locale}`;
  const breadcrumb = breadcrumbLd([
    { name: tc("breadcrumb_home"), url: base },
    { name: t("eyebrow"), url: `${base}/contact` },
  ]);

  return (
    <main>
      <JsonLd data={breadcrumb} />

      <section className="pt-16 sm:pt-20">
        <div className="mx-auto max-w-4xl px-4">
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
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4">
          {/* Prominent messenger CTAs */}
          <Reveal className="flex flex-col gap-3 sm:flex-row">
            <MessengerCTA
              channel="whatsapp"
              size="lg"
              className="h-12 flex-1 bg-brand px-6 text-base text-brand-foreground hover:bg-brand/90"
              label={tc("cta_whatsapp")}
            />
            <MessengerCTA
              channel="telegram"
              variant="outline"
              size="lg"
              className="h-12 flex-1 px-6 text-base"
              label={tc("cta_telegram")}
            />
          </Reveal>

          {/* Working hours / response time */}
          <Reveal className="mt-8 flex items-start gap-3 rounded-xl border border-border/60 bg-card/40 p-5">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <Clock className="size-5" />
            </span>
            <div className="flex flex-col gap-1">
              <h2 className="font-display text-base font-semibold">
                {t("hours_title")}
              </h2>
              <p className="text-sm text-muted-foreground">{t("hours")}</p>
            </div>
          </Reveal>

          {/* Current location — territorially based in Almaty, with the date this
              presence info was last confirmed. */}
          <Reveal className="mt-4 flex items-start gap-3 rounded-xl border border-border/60 bg-card/40 p-5">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <MapPin className="size-5" />
            </span>
            <div className="flex flex-col gap-1">
              <h2 className="font-display text-base font-semibold">
                {t("location_title")}
              </h2>
              <p className="text-sm text-muted-foreground">{t("location")}</p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                {t("location_updated")}
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
