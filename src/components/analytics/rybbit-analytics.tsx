import Script from "next/script";

/**
 * Rybbit web analytics, self-hosted at stats.suslicketeam.com. Cookieless, so
 * (like the Cloudflare beacon) it loads regardless of consent state. The script
 * tracks SPA route changes itself — no manual pageview calls.
 *
 * NOTE: session replay is OFF in the Rybbit site settings. If it is ever turned
 * on there, this must become consent-gated like Yandex Metrika.
 */
export function RybbitAnalytics() {
  // ponytail: siteId is public and never changes, so no env var; prod-only
  // keeps `next dev` hits out of the stats.
  if (process.env.NODE_ENV !== "production") return null;

  return (
    <Script
      src="https://stats.suslicketeam.com/api/script.js?siteId=10f12585098a"
      strategy="afterInteractive"
    />
  );
}
