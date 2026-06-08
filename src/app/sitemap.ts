import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/config";

/**
 * Locale-less route paths known to the site. Home is the empty string.
 * TODO Phase 5: add case detail slugs (see `caseSlugs` below).
 */
const ROUTES = [
  "",
  "/services",
  "/services/landing",
  "/services/web-apps",
  "/services/ai",
  "/services/mobile",
  "/services/seo",
  "/cases",
  "/about",
  "/contact",
] as const;

// TODO Phase 5: populate from the cases data source and append
// `/cases/${slug}` for each. Kept as a helper so wiring is a one-liner.
const caseSlugs: readonly string[] = [];

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
