import { test, expect } from "@playwright/test";

// Deep, data-aware execution-company detail tests against the stable dev-DB
// seed (company 3 = شركة الرحلات السياحية: balance 29,000, 3 offers,
// 4 bookings, 1 execution payment of 14,000).

test.describe("Company Detail — reference company 3", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/execution-companies/3");
    await page.waitForLoadState("networkidle");
  });

  test("header shows company name, badge, contact person and phone", async ({ page }) => {
    const main = page.locator("main");
    await expect(main.getByRole("heading", { name: "شركة الرحلات السياحية" })).toBeVisible();
    await expect(main.getByText("شركة تنفيذ").first()).toBeVisible();
    await expect(main.getByText("جهة الاتصال: محمد رشدي")).toBeVisible();
    await expect(main.getByText("الهاتف: 01011122233")).toBeVisible();
  });

  test("overview data card shows all company details", async ({ page }) => {
    const main = page.locator("main");
    await expect(main.getByText("بيانات الشركة").first()).toBeVisible();
    await expect(main.getByText("اسم الشركة").first()).toBeVisible();
    await expect(main.getByText("جهة الاتصال").first()).toBeVisible();
    await expect(main.getByText("وسط البلد، القاهرة").first()).toBeVisible();
  });

  test("financial summary card shows balance, offers, execution cost, bookings and payments", async ({ page }) => {
    const main = page.locator("main");
    await expect(main.getByText("الملخص المالي").first()).toBeVisible();
    await expect(main.getByText("29,000.00 ج.م").first()).toBeVisible(); // balance
    await expect(main.getByText("3 عرض").first()).toBeVisible(); // offers
    await expect(main.getByText("88,000.00 ج.م").first()).toBeVisible(); // execution cost total
    await expect(main.getByText("4 حجز").first()).toBeVisible(); // bookings
    await expect(main.getByText("14,000.00 ج.م").first()).toBeVisible(); // payments total
  });

  test("tabs expose offers, bookings, payments and statement", async ({ page }) => {
    await expect(page.getByRole("tab", { name: /نظرة عامة/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /العروض \(3\)/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /الحجوزات \(4\)/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /المدفوعات \(1\)/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /كشف الحساب/ })).toBeVisible();
  });

  test("bookings tab lists the company bookings and deep-links to detail", async ({ page }) => {
    await page.getByRole("tab", { name: /الحجوزات/ }).click();
    const main = page.locator("main");
    // 4 bookings rows for company 3
    expect(await main.locator("tbody tr").count()).toBe(4);
    // each row deep-links to its booking detail
    await expect(main.locator('a[href="/bookings/1"]')).toBeVisible();
    await expect(main.locator('a[href="/bookings/2"]')).toBeVisible();
    await expect(main.locator('a[href="/bookings/4"]')).toBeVisible();
    await expect(main.locator('a[href="/bookings/5"]')).toBeVisible();
    // customer rows are shown for those bookings
    await expect(main.getByText("خالد عبدالله سعيد").first()).toBeVisible();
    await expect(main.getByText("أحمد محمد علي").first()).toBeVisible();
  });

  test("payments tab lists the execution payment row", async ({ page }) => {
    await page.getByRole("tab", { name: /المدفوعات/ }).click();
    const main = page.locator("main");
    await expect(main.getByText("14,000.00 ج.م").first()).toBeVisible();
    await expect(main.getByText("دفع نصف المبلغ").first()).toBeVisible();
  });

  test("back link returns to the company list", async ({ page }) => {
    const back = page.getByRole("link", { name: /العودة للقائمة/ });
    await expect(back).toBeVisible();
    await back.click();
    await page.waitForURL("**/execution-companies");
    expect(page.url()).toMatch(/\/execution-companies$/);
  });
});
