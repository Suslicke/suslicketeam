import type { Metadata } from "next";

import { siteConfig, type Locale } from "@/lib/config";

type OgImages = NonNullable<NonNullable<Metadata["openGraph"]>["images"]>;

/**
 * Maps an app locale to its OpenGraph `og:locale` value (language_REGION).
 * hreflang itself stays region-less (plain `ru`/`kk`/`en`).
 */
const OG_LOCALE: Record<Locale, string> = {
  ru: "ru_RU",
  kk: "kk_KZ",
  en: "en_US",
};

const SITE_NAME = "suslicketeam";

export interface BuildMetadataArgs {
  /** App locale for this page. */
  locale: Locale;
  /** Locale-less route path, e.g. "" (home), "/services", "/cases/loyrush". */
  path: string;
  title: string;
  description: string;
  /** Optional OG/Twitter images. Defaults to the per-locale opengraph-image route. */
  images?: OgImages;
}

/** Builds `/<locale><path>` (home => `/<locale>`). */
function localePath(locale: string, path: string): string {
  return `/${locale}${path}`;
}

/**
 * Builds a Next.js `Metadata` object with canonical + hreflang alternates,
 * OpenGraph and Twitter cards for a given localized route.
 */
export function buildMetadata({
  locale,
  path,
  title,
  description,
  images,
}: BuildMetadataArgs): Metadata {
  const canonical = localePath(locale, path);

  // hreflang map: every locale + x-default -> defaultLocale path.
  const languages: Record<string, string> = {};
  for (const loc of siteConfig.locales) {
    languages[loc] = localePath(loc, path);
  }
  languages["x-default"] = localePath(siteConfig.defaultLocale, path);

  const ogImages = images ?? [{ url: localePath(locale, "/opengraph-image") }];

  return {
    metadataBase: new URL(siteConfig.url),
    title,
    description,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: OG_LOCALE[locale],
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImages,
    },
  };
}
