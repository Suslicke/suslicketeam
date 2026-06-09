declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag?: (...a: any[]) => void;
    posthog?: {
      capture: (n: string, p?: Record<string, unknown>) => void;
      opt_in_capturing?: () => void;
      opt_out_capturing?: () => void;
    };
    ym?: (...a: unknown[]) => void;
  }
}

// Yandex Metrika counter id (inlined at build time). Present only when the
// counter is configured; trackEvent sends `reachGoal` to it when so.
const METRIKA_ID = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID;

/**
 * Dispatch an analytics event to all configured providers — Google Analytics
 * (`gtag`), PostHog (`posthog.capture`), and Yandex Metrika (`ym` `reachGoal`).
 * Each provider call is wrapped in its own try/catch so a failing one never
 * blocks the others, and the whole function is a no-op during SSR or when no
 * provider is present. Metrika only has a `ym` function after consent (its tag
 * isn't loaded until then), so its goals are consent-gated by construction.
 */
export function trackEvent(
  name: string,
  params?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;

  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", name, params);
    }
  } catch {
    // swallow provider errors so other providers still fire
  }

  try {
    if (typeof window.posthog?.capture === "function") {
      window.posthog.capture(name, params);
    }
  } catch {
    // swallow provider errors so other providers still fire
  }

  try {
    if (METRIKA_ID && typeof window.ym === "function") {
      window.ym(Number(METRIKA_ID), "reachGoal", name, params);
    }
  } catch {
    // swallow provider errors so other providers still fire
  }
}
