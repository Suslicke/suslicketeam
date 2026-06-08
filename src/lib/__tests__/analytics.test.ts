import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { trackEvent } from "../analytics";

describe("trackEvent", () => {
  beforeEach(() => {
    delete window.gtag;
    delete window.posthog;
  });

  afterEach(() => {
    delete window.gtag;
    delete window.posthog;
    vi.restoreAllMocks();
  });

  test("calls gtag with correct args", () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    trackEvent("lead_submit", { page: "/ru" });
    expect(gtag).toHaveBeenCalledWith("event", "lead_submit", { page: "/ru" });
  });

  test("calls posthog.capture with correct args", () => {
    const capture = vi.fn();
    window.posthog = { capture };
    trackEvent("lead_submit", { page: "/ru" });
    expect(capture).toHaveBeenCalledWith("lead_submit", { page: "/ru" });
  });

  test("calls both providers when present", () => {
    const gtag = vi.fn();
    const capture = vi.fn();
    window.gtag = gtag;
    window.posthog = { capture };
    trackEvent("click");
    expect(gtag).toHaveBeenCalledWith("event", "click", undefined);
    expect(capture).toHaveBeenCalledWith("click", undefined);
  });

  test("does not throw when neither provider exists", () => {
    expect(() => trackEvent("noop", { a: 1 })).not.toThrow();
  });

  test("one provider throwing does not stop the other", () => {
    const gtag = vi.fn(() => {
      throw new Error("gtag boom");
    });
    const capture = vi.fn();
    window.gtag = gtag;
    window.posthog = { capture };
    expect(() => trackEvent("evt")).not.toThrow();
    expect(gtag).toHaveBeenCalled();
    expect(capture).toHaveBeenCalledWith("evt", undefined);
  });

  test("does not throw in SSR (window undefined)", () => {
    const originalWindow = globalThis.window;
    // @ts-expect-error simulate SSR
    delete globalThis.window;
    try {
      expect(() => trackEvent("evt")).not.toThrow();
    } finally {
      globalThis.window = originalWindow;
    }
  });
});
