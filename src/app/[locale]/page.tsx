import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { CasesPreview } from "@/components/sections/cases-preview";
import { CtaSection } from "@/components/sections/cta-section";
import { Faq } from "@/components/sections/faq";
import { Hero } from "@/components/sections/hero";
import { Logos } from "@/components/sections/logos";
import { Process } from "@/components/sections/process";
import { ServicesOverview } from "@/components/sections/services-overview";
import { Testimonials } from "@/components/sections/testimonials";
import { WhyUs } from "@/components/sections/why-us";
import type { Locale } from "@/lib/config";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { getTranslations } = await import("next-intl/server");
  const meta = await getTranslations({ locale, namespace: "meta" });

  return buildMetadata({
    locale: locale as Locale,
    path: "",
    title: meta("default_title"),
    description: meta("default_description"),
  });
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main>
      <Hero />
      <Logos />
      <ServicesOverview />
      <CasesPreview />
      <Process />
      <WhyUs />
      <Testimonials />
      <Faq />
      <CtaSection />
    </main>
  );
}
