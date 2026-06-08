import Script from "next/script";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/**
 * Loads Google Analytics 4 via gtag using `next/script` with the
 * `afterInteractive` strategy so it never blocks LCP/hydration. Gated on
 * `NEXT_PUBLIC_GA_ID` — renders nothing when the ID is absent (graceful no-op
 * for local dev / e2e without keys).
 *
 * Consent Mode v2: storage is denied by default until the user grants it via
 * the consent banner (which calls `gtag('consent','update', ...)`). With GA4
 * "basic" consent mode, no GA cookies or hits fire while denied.
 */
export function GaScripts() {
  if (!GA_ID) return null;

  return (
    <>
      <Script
        id="ga-consent-default"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('consent', 'default', {
              'ad_storage': 'denied',
              'ad_user_data': 'denied',
              'ad_personalization': 'denied',
              'analytics_storage': 'denied',
              'wait_for_update': 500
            });
          `,
        }}
      />
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script
        id="ga-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `,
        }}
      />
    </>
  );
}
