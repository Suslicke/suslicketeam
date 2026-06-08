import { expect, test } from "@playwright/test";

test.describe("home page", () => {
  test("renders hero, services, cases, faq and a WhatsApp CTA", async ({
    page,
  }) => {
    const response = await page.goto("/ru");

    // The hero headline must be in the initial server HTML — not injected by JS.
    // Assert against the raw response body before any client hydration.
    const html = (await response?.text()) ?? "";
    expect(html).toContain("приносят клиентов");

    // Hero headline visible without waiting for the canvas to mount.
    const heading = page.getByRole("heading", {
      level: 1,
      name: /приносят клиентов/i,
    });
    await expect(heading).toBeVisible();

    // Services grid: 5 cards, each linking to /ru/services/<slug>.
    const serviceLinks = page.locator('a[href^="/ru/services/"]');
    await expect(serviceLinks).toHaveCount(5);

    // At least one featured case is shown (live link to a known case).
    await expect(
      page.locator('a[href="https://loyrush.com"]').first(),
    ).toBeVisible();

    // Live-projects section: "open site" links point to real, verifiable
    // project URLs the visitor can open and check.
    await expect(page.getByText("Живые проекты, а не")).toBeVisible();
    await expect(
      page.locator('a[href="https://exchange-bridge.com"]').first(),
    ).toBeVisible();

    // FAQ accordion expands on click.
    const firstQuestion = page
      .getByRole("button", { name: /Сколько стоит/i })
      .first();
    await expect(firstQuestion).toBeVisible();
    await expect(firstQuestion).toHaveAttribute("aria-expanded", "false");
    await firstQuestion.click();
    await expect(firstQuestion).toHaveAttribute("aria-expanded", "true");

    // A WhatsApp CTA href points at wa.me.
    const wa = page.locator('a[data-channel="whatsapp"]').first();
    const href = await wa.getAttribute("href");
    expect(href).toContain("wa.me");
  });
});
