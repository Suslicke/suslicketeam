import { expect, test } from "@playwright/test";

test.describe("i18n", () => {
  test("language switcher preserves path and switches RU to KK", async ({
    page,
  }) => {
    await page.goto("/ru");
    await expect(page).toHaveURL(/\/ru$/);

    // The Russian nav label must be present first.
    await expect(page.getByRole("link", { name: "Услуги" }).first()).toBeVisible();

    // Switch to Kazakh via the language switcher (button labelled "KK").
    await page.getByRole("button", { name: "KK", exact: true }).first().click();

    // URL must now carry the `/kk` prefix...
    await expect(page).toHaveURL(/\/kk(\/|$)/);

    // ...and a known Kazakh string must be visible.
    await expect(
      page.getByRole("link", { name: "Қызметтер" }).first(),
    ).toBeVisible();
  });

  test("switches RU to EN preserving path", async ({ page }) => {
    await page.goto("/ru");
    await page.getByRole("button", { name: "EN", exact: true }).first().click();
    await expect(page).toHaveURL(/\/en(\/|$)/);
    await expect(
      page.getByRole("link", { name: "Services" }).first(),
    ).toBeVisible();
  });
});
