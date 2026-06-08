import { expect, test } from "@playwright/test";

test.describe("analytics", () => {
  test("renders the page and gracefully no-ops PostHog without a key", async ({
    page,
  }) => {
    await page.goto("/ru");

    // Provider must render its children even with no PostHog key configured.
    await expect(
      page.getByRole("link", { name: /suslicketeam/i }).first(),
    ).toBeVisible();

    // With no NEXT_PUBLIC_POSTHOG_KEY set, the SDK never initializes, so the
    // global must be absent (no network, no cookies, no crash).
    const posthogState = await page.evaluate(() => {
      const ph = (window as unknown as { posthog?: { __loaded?: boolean } })
        .posthog;
      return { defined: typeof ph !== "undefined", loaded: ph?.__loaded };
    });
    expect(posthogState.defined).toBe(false);
    expect(posthogState.loaded).toBeFalsy();

    // No uncaught page errors during load.
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.reload();
    expect(errors).toEqual([]);
  });
});
