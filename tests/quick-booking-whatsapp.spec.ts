import { test, expect } from "@playwright/test";

test.describe("Quick Booking WhatsApp & Airports", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
  });

  test("quick حجز جديد button opens the modal", async ({ page }) => {
    await page.locator("button").filter({ hasText: "+ حجز جديد" }).click();
    await expect(page.getByRole("heading", { name: "حجز جديد" })).toBeVisible();
  });

  test("quick booking modal shows airport dropdowns", async ({ page }) => {
    await page.locator("button").filter({ hasText: "+ حجز جديد" }).click();
    const origin = page.locator('[role="combobox"][aria-label="اختر مطار المغادرة"]');
    const dest = page.locator('[role="combobox"][aria-label="اختر مطار الوصول"]');
    await expect(origin).toBeVisible();
    await expect(dest).toBeVisible();
  });

  test("airport dropdown lists world airports by search", async ({ page }) => {
    await page.locator("button").filter({ hasText: "+ حجز جديد" }).click();
    const origin = page.locator('[role="combobox"][aria-label="اختر مطار المغادرة"]');
    await origin.click();
    const search = page.getByPlaceholder(/ابحث عن مطار/);
    await expect(search).toBeVisible();
    await search.fill("جدة");
    await expect(page.locator("[cmdk-item]").first()).toBeVisible();
  });
});
