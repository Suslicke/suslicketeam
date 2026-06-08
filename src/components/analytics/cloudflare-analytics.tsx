import Script from "next/script";

const CF_TOKEN = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;

/**
 * Loads the Cloudflare Web Analytics beacon. Cloudflare's beacon is cookieless
 * and privacy-friendly, so it can load regardless of consent state. Gated on
 * `NEXT_PUBLIC_CF_BEACON_TOKEN` — renders nothing when absent (graceful no-op).
 *
 * Uses `afterInteractive` to keep it off the critical rendering path.
 */
export function CloudflareAnalytics() {
  if (!CF_TOKEN) return null;

  return (
    <Script
      src="https://static.cloudflareinsights.com/beacon.min.js"
      strategy="afterInteractive"
      data-cf-beacon={JSON.stringify({ token: CF_TOKEN })}
    />
  );
}
