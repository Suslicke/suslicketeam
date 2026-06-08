import { expect, test } from "@playwright/test";

test.describe("lead form", () => {
  test("shows validation errors when submitting empty", async ({ page }) => {
    await page.goto("/ru/contact");

    // The form heading "Оставьте заявку" anchors the form region.
    const form = page.locator("form").filter({ hasText: "Оставьте заявку" });
    await expect(form).toBeVisible();

    await form.getByRole("button", { name: /Отправить заявку/ }).click();

    // Field-level validation errors should appear (name + contact + type).
    await expect(form.getByText("Введите имя (минимум 2 символа)")).toBeVisible();
    await expect(form.getByText("Укажите контакт для связи")).toBeVisible();
    // The projectType error text equals the select placeholder, so target the
    // error paragraph element specifically (the <p>, not the select value span).
    await expect(form.locator('p[id$="-projectType-error"]')).toBeVisible();

    // Still on the form, no success state.
    await expect(form.getByText("Заявка отправлена!")).toHaveCount(0);
  });

  test("submits valid data and shows success", async ({ page }) => {
    // Mock the API so the test is hermetic and doesn't depend on env sinks.
    await page.route("**/api/lead", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, delivered: false }),
      });
    });

    await page.goto("/ru/contact");

    const form = page.locator("form").filter({ hasText: "Оставьте заявку" });
    await expect(form).toBeVisible();

    await form.getByLabel("Имя").fill("Иван Петров");
    await form.getByLabel("Контакт").fill("+77066998879");

    // Open the project-type select and pick the first real option.
    await form.getByRole("combobox").click();
    await page.getByRole("option", { name: "Лендинг" }).click();

    await form.getByRole("button", { name: /Отправить заявку/ }).click();

    // Success state replaces the form.
    await expect(page.getByText("Заявка отправлена!")).toBeVisible();
  });
});
