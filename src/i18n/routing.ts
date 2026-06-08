import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

import { siteConfig } from "@/lib/config";

export const routing = defineRouting({
  // Reuse the single source of truth from Phase 1.
  locales: siteConfig.locales,
  defaultLocale: siteConfig.defaultLocale,
  localePrefix: "always",
});

// Lightweight wrappers around Next.js' navigation APIs that consider the
// routing configuration (locale prefixing, etc.).
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
