import { expect, test } from "@playwright/test";

test.describe("theme", () => {
  test("applies dark theme on first paint without flash", async ({ page }) => {
    await page.goto("/ru");
    // The blocking script injected by next-themes must set `dark` before
    // first paint — assert immediately without waiting for hydration.
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("toggles to light and persists across reload", async ({ page }) => {
    await page.goto("/ru");
    const html = page.locator("html");
    await expect(html).toHaveClass(/dark/);

    const toggle = page.getByRole("button", { name: /switch to light theme/i });
    await toggle.click();

    // After toggling, the `dark` class must be removed (light theme).
    await expect(html).not.toHaveClass(/dark/);

    // Persisted via localStorage: a reload should keep the light theme.
    await page.reload();
    await expect(html).not.toHaveClass(/dark/);
  });
});
