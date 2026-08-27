import { test, expect } from "@playwright/test";

test.describe("Quick Booking Create → WhatsApp", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
  });

  test("creating a booking opens the WhatsApp dialog with the entered data", async ({ page }) => {
    await page.locator("button").filter({ hasText: "+ حجز جديد" }).click();
    await expect(page.getByRole("heading", { name: "حجز جديد" })).toBeVisible();

    // Select origin airport (Cairo)
    const origin = page.locator('[role="combobox"][aria-label="اختر مطار المغادرة"]');
    await origin.click();
    const search = page.getByPlaceholder(/ابحث عن مطار/);
    await search.fill("القاهرة");
    await page.locator("[cmdk-item]").filter({ hasText: "CAI" }).first().click();

    // Select destination airport (Jeddah)
    const dest = page.locator('[role="combobox"][aria-label="اختر مطار الوصول"]');
    await dest.click();
    await page.getByPlaceholder(/ابحث عن مطار/).fill("جدة");
    await page.locator("[cmdk-item]").filter({ hasText: "JED" }).first().click();

    // Choose a customer and fill the rest
    await page.locator('[data-slot="select-trigger"]').first().click();
    await page.locator("[data-slot='select-item']").first().click();
    await page.locator('input[name="depart_date"]').fill("2026-09-10");
    await page.locator('input[name="passengers_count"]').fill("2");

    await page.getByRole("button", { name: "إنشاء الحجز" }).click();

    // WhatsApp dialog should appear with the entered data
    await expect(page.getByRole("heading", { name: /أرسل الطلب عبر واتساب/ })).toBeVisible();
    const textarea = page.locator("textarea");
    const text = await textarea.inputValue();
    expect(text).toContain("القاهرة");
    expect(text).toContain("الملك عبد العزيز");
    expect(text).toContain("2");

    // Optional flexible-dates checkbox exists and works
    const flexible = page.locator("input[type=checkbox]");
    await expect(flexible).toBeVisible();
    await flexible.check();
    const withFlexible = await textarea.inputValue();
    expect(withFlexible).toContain("ممكن تشوف يوم قبل او يوم بعد ارخص سعر");

    // Resume button is available
    await expect(page.getByRole("button", { name: /متابعة إلى مرحلة العرض/ })).toBeVisible();
  });
});
