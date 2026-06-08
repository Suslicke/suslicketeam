import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/config";
import { getCases, getServices } from "@/lib/content";

/**
 * Locale-less route paths known to the site. Home is the empty string. Service
 * detail paths are derived from the content model below.
 */
const STATIC_ROUTES = [
  "",
  "/services",
  "/cases",
  "/about",
  "/contact",
] as const;

const ROUTES = [
  ...STATIC_ROUTES,
  ...getServices().map((s) => `/services/${s.slug}`),
] as const;

const caseSlugs: readonly string[] = getCases().map((c) => c.slug);

/** Absolute URL for a locale + locale-less path. */
function abs(locale: string, path: string): string {
  return `${siteConfig.url}/${locale}${path}`;
}

/** hreflang language map (every locale) for a given locale-less path. */
function languagesFor(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const loc of siteConfig.locales) {
    languages[loc] = abs(loc, path);
  }
  languages["x-default"] = abs(siteConfig.defaultLocale, path);
  return languages;
}

function priorityFor(path: string): number {
  if (path === "") return 1;
  if (path === "/services" || path === "/cases" || path === "/contact") return 0.8;
  return 0.6;
}

function changeFrequencyFor(
  path: string,
): MetadataRoute.Sitemap[number]["changeFrequency"] {
  if (path === "" || path === "/cases") return "weekly";
  return "monthly";
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const paths: string[] = [
    ...ROUTES,
    ...caseSlugs.map((slug) => `/cases/${slug}`),
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const path of paths) {
    for (const locale of siteConfig.locales) {
      entries.push({
        url: abs(locale, path),
        lastModified,
        changeFrequency: changeFrequencyFor(path),
        priority: priorityFor(path),
        alternates: {
          languages: languagesFor(path),
        },
      });
    }
  }

  return entries;
}
