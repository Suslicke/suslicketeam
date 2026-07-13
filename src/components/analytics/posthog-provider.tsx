"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

/**
 * Initialize PostHog once on the client, guarded against double-init (React
 * StrictMode / fast refresh) via the SDK's own `__loaded` flag. Returns whether
 * a live instance is available. No-op (returns false) when the key is absent so
 * local dev and e2e without keys render normally and `window.posthog` stays
 * effectively inert.
 */
function ensurePosthog(): boolean {
  if (!POSTHOG_KEY) return false;
  if (typeof window === "undefined") return false;

  // `__loaded` is set by posthog-js after init; treat it as the source of truth
  // so we never re-init across renders or hot reloads.
  if (!posthog.__loaded) {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      // We fire `$pageview` manually on route change (SPA), so disable the
      // SDK's automatic capture which would otherwise only fire once on load.
      capture_pageview: false,
      capture_pageleave: true,
      // "always" → build a person profile for every (consented) visitor, so the
      // same person is recognised across sessions and described with auto-captured
      // properties (geo, device, $initial_utm_*, first/last seen).
      person_profiles: "always",
      // GDPR: do not transmit any $pageview/event until the user accepts via the
      // consent banner (which calls posthog.opt_in_capturing()). On decline the
      // banner calls opt_out_capturing(), keeping the SDK silent.
      opt_out_capturing_by_default: true,
    });
    // The PostHog project is shared with suslicke.com (free plan, one
    // project): stamp every event with a super property so the two sites
    // stay separable in insights/filters.
    posthog.register({ site: "suslicketeam.com" });
  }
  return true;
}

/**
 * Captures a manual `$pageview` on every App Router navigation. `useSearchParams`
 * requires a Suspense boundary in Next 15 (CSR bailout), so this component is
 * always rendered inside <Suspense> by the parent provider.
 */
function PostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!posthog.__loaded) return;

    let url = window.origin + pathname;
    const search = searchParams.toString();
    if (search) url += `?${search}`;

    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  // Resolve once on mount. Init must happen client-side; we gate rendering of
  // the SDK provider on whether a live instance exists.
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(ensurePosthog());
  }, []);

  if (!loaded) {
    // Graceful no-op: no key (or not yet initialized) — render children plain.
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageview />
      </Suspense>
      {children}
    </PHProvider>
  );
}
