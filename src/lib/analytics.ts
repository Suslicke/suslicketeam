declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag?: (...a: any[]) => void;
    posthog?: {
      capture: (n: string, p?: Record<string, unknown>) => void;
    };
  }
}

/**
 * Dispatch an analytics event to all configured providers (Google Analytics
 * via `gtag` and PostHog via `posthog.capture`). Each provider call is wrapped
 * in its own try/catch so a failing one never blocks the other, and the whole
 * function is a no-op during SSR or when no provider is present.
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
}
