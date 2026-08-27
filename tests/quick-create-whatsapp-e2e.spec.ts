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

    // Choose a customer via the typeahead (search by phone digits) and fill the rest
    const customerField = page.locator('[role="combobox"][aria-label="بحث عن عميل"]');
    await customerField.click();
    const custSearch = page.getByPlaceholder("ابحث بالاسم أو رقم الهاتف...");
    // First 3 digits of فاطمة (01123456789)
    await custSearch.fill("0112");
    await page.waitForTimeout(300);
    await page.locator("[cmdk-item]").filter({ hasText: "فاطمة" }).first().click();
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
    // PRIVACY: the execution company must NOT see the customer's name or phone
    expect(text).not.toContain("العميل:");
    expect(text).not.toContain("فاطمة");
    expect(text).not.toContain("01123456789");

    // Optional flexible-dates checkbox exists and works
    const flexible = page.locator("label", { hasText: "ممكن تشوف يوم قبل او يوم بعد ارخص سعر" }).locator("input[type=checkbox]");
    await expect(flexible).toBeVisible();
    await flexible.check();
    const withFlexible = await textarea.inputValue();
    expect(withFlexible).toContain("ممكن تشوف يوم قبل او يوم بعد ارخص سعر");

    // Multi-select: select a second company
    const companyLabels = page.locator("label", { has: page.locator("input[type=checkbox]") }).filter({ hasNotText: "ممكن تشوف" });
    const secondCompany = companyLabels.nth(1).locator("input[type=checkbox]");
    await secondCompany.check();
    await expect(page.getByRole("button", { name: /إرسال عبر واتساب \(2 شركات\)/ })).toBeVisible();

    // Sending without any company is allowed: pick a contact inside WhatsApp
    const allCompanyChecks = page.locator("label", { has: page.locator("input[type=checkbox]") }).filter({ hasNotText: "ممكن تشوف" }).locator("input[type=checkbox]");
    for (let i = 0; i < await allCompanyChecks.count(); i++) {
      if (await allCompanyChecks.nth(i).isChecked()) await allCompanyChecks.nth(i).uncheck();
    }
    await expect(page.getByRole("button", { name: /إرسال عبر واتساب \(اختر جهة الاتصال\)/ })).toBeVisible();

    // Resume button is available
    await expect(page.getByRole("button", { name: /متابعة إلى مرحلة العرض/ })).toBeVisible();
  });
});

test.describe("Quick Booking dialogs are responsive", () => {
  test.use({ viewport: { width: 375, height: 700 } });

  test("booking modal is scrollable on a small screen", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.locator("button").filter({ hasText: "+ حجز جديد" }).click();
    await expect(page.getByRole("heading", { name: "حجز جديد" })).toBeVisible();
    const dialog = page.locator('[data-slot="dialog-content"]');
    await expect(dialog).toBeVisible();
    // The dialog must be bounded by the viewport height and scrollable
    const box = await dialog.boundingBox();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(700 + 1);
  });
});
