import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { CloudflareAnalytics } from "@/components/analytics/cloudflare-analytics";
import { ConsentBanner } from "@/components/analytics/consent-banner";
import { GaScripts } from "@/components/analytics/ga-scripts";
import { PostHogProvider } from "@/components/analytics/posthog-provider";
import { UtmCapture } from "@/components/analytics/utm-capture";
import { JsonLd } from "@/components/json-ld";
import { QrWelcome } from "@/components/qr-welcome";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StickyMessenger } from "@/components/sticky-messenger";
import { ThemeProvider } from "@/components/theme-provider";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/lib/config";
import { buildMetadata } from "@/lib/seo";
import {
  localBusinessLd,
  organizationLd,
  websiteLd,
} from "@/lib/structured-data";

import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  const base = buildMetadata({
    locale: locale as Locale,
    path: "",
    title: t("default_title"),
    description: t("default_description"),
  });

  return {
    ...base,
    title: {
      default: t("default_title"),
      template: "%s — suslicketeam",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering.
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable}`}
    >
      <body className="antialiased">
        <GaScripts />
        <CloudflareAnalytics />
        <JsonLd data={organizationLd()} />
        <JsonLd data={websiteLd()} />
        <JsonLd data={localBusinessLd()} />
        <NextIntlClientProvider>
          <ThemeProvider>
            <PostHogProvider>
              <UtmCapture />
              <QrWelcome />
              <div className="flex min-h-screen flex-col">
                <SiteHeader />
                <div className="flex-1">{children}</div>
                <SiteFooter />
              </div>
              <StickyMessenger />
              <ConsentBanner />
            </PostHogProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
