"use client";

import { useEffect } from "react";

import { persistUtm } from "@/lib/utm";

/**
 * Persists first-touch UTM params on mount. Reads `window.location.search`
 * directly (rather than `useSearchParams`) so it needs no Suspense boundary and
 * captures the original landing query before any client navigation. Renders
 * nothing. `persistUtm` is first-touch and SSR-safe, so this is idempotent.
 */
export function UtmCapture() {
  useEffect(() => {
    persistUtm(window.location.search);
  }, []);

  return null;
}
