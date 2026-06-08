import { expect, test } from "@playwright/test";

test.describe("inner pages", () => {
  test("services overview shows 5 services and links into a detail page", async ({
    page,
  }) => {
    await page.goto("/ru/services");

    // Five service cards, each linking to /ru/services/<slug>.
    const serviceLinks = page.locator('a[href^="/ru/services/"]');
    await expect(serviceLinks).toHaveCount(5);

    // The "Лендинги и сайты" service title appears on the overview.
    await expect(page.getByText("Лендинги и сайты").first()).toBeVisible();

    // Navigate straight to a known detail page and assert its title (h1).
    await page.goto("/ru/services/landing");
    await expect(
      page.getByRole("heading", { name: "Лендинги и сайты", level: 1 }),
    ).toBeVisible();
  });

  test("cases grid shows all 12 cases and a detail page renders a live link", async ({
    page,
  }) => {
    await page.goto("/ru/cases");

    // Twelve case cards, each linking to /ru/cases/<slug>.
    const caseLinks = page.locator('a[href^="/ru/cases/"]');
    await expect(caseLinks).toHaveCount(12);

    // LoyRush detail page.
    await page.goto("/ru/cases/loyrush");
    await expect(
      page.getByRole("heading", { name: "LoyRush", level: 1 }),
    ).toBeVisible();

    // A prominent live-link button to the production site (rel=noopener).
    const live = page.locator("a[data-live-link]");
    await expect(live).toBeVisible();
    await expect(live).toHaveAttribute("href", "https://loyrush.com");
    await expect(live).toHaveAttribute("rel", /noopener/);
  });

  test("NDA case detail renders an 'Под NDA' note and no live link", async ({
    page,
  }) => {
    await page.goto("/ru/cases/nda-furniture");
    await expect(
      page.getByRole("heading", { name: "Магазин мебели (под NDA)", level: 1 }),
    ).toBeVisible();

    // No external live-link button on a confidential case.
    await expect(page.locator("a[data-live-link]")).toHaveCount(0);
    // A muted "Под NDA" note is shown instead.
    await expect(page.getByText("Под NDA").first()).toBeVisible();
  });

  test("about page renders its sections", async ({ page }) => {
    await page.goto("/ru/about");
    await expect(
      page.getByRole("heading", {
        name: /Команда, которой можно доверить продукт/i,
        level: 2,
      }),
    ).toBeVisible();
    // Stack section lists Next.js.
    await expect(page.getByText("Next.js").first()).toBeVisible();
  });

  test("contact page renders both messenger CTAs", async ({ page }) => {
    await page.goto("/ru/contact");
    await expect(page.locator('a[data-channel="whatsapp"]').first()).toBeVisible();
    await expect(page.locator('a[data-channel="telegram"]').first()).toBeVisible();

    const wa = page.locator('a[data-channel="whatsapp"]').first();
    const href = await wa.getAttribute("href");
    expect(href).toContain("wa.me");
  });

  test("unknown service slug returns 404", async ({ page }) => {
    const response = await page.goto("/ru/services/nope");
    expect(response?.status()).toBe(404);
  });
});
