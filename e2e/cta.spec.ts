import { expect, test } from "@playwright/test";

test.describe("messenger cta", () => {
  test("builds a WhatsApp href with page + first-touch UTM and tracks the click", async ({
    page,
  }) => {
    // Stub analytics globals before any script runs so we can capture the event
    // the CTA dispatches via trackEvent (gtag + posthog).
    await page.addInitScript(() => {
      const w = window as unknown as {
        __events: unknown[];
        gtag: (...a: unknown[]) => void;
        posthog: { capture: (n: string, p?: unknown) => void };
      };
      w.__events = [];
      w.gtag = (...args: unknown[]) => {
        w.__events.push({ provider: "gtag", args });
      };
      w.posthog = {
        capture: (name: string, props?: unknown) => {
          w.__events.push({ provider: "posthog", name, props });
        },
      };
    });

    await page.goto("/ru?utm_source=instagram&utm_campaign=jan");

    // Dismiss consent so it doesn't overlay the footer CTA region.
    const banner = page.getByRole("dialog", { name: /cookie/i });
    if (await banner.isVisible()) {
      await banner.getByRole("button", { name: "Принять" }).click();
    }

    // The header WhatsApp CTA (first one).
    const cta = page.locator('a[data-channel="whatsapp"]').first();
    const href = await cta.getAttribute("href");
    expect(href).toBeTruthy();

    const url = new URL(href!);
    expect(url.host).toBe("wa.me");
    expect(url.pathname).toBe("/77066998879");

    // Decoded prefilled text must contain the captured UTM source and page.
    const text = url.searchParams.get("text") ?? "";
    expect(text).toContain("instagram");
    expect(text).toContain("/ru");

    // Prevent the click from opening a new tab / navigating away.
    await cta.evaluate((el) => el.removeAttribute("target"));
    await page.evaluate(() => {
      document.querySelectorAll('a[data-channel="whatsapp"]').forEach((a) => {
        a.addEventListener("click", (e) => e.preventDefault());
      });
    });

    await cta.click();

    const events = await page.evaluate(
      () => (window as unknown as { __events: unknown[] }).__events,
    );
    const phEvent = events.find(
      (e) =>
        (e as { provider: string; name?: string }).provider === "posthog" &&
        (e as { name?: string }).name === "lead_messenger_click",
    ) as { props?: { channel?: string; page?: string } } | undefined;

    expect(phEvent).toBeTruthy();
    expect(phEvent?.props?.channel).toBe("whatsapp");
    expect(phEvent?.props?.page).toContain("/ru");
  });
});
