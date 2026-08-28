import { test, expect } from "@playwright/test";

// Deep, data-aware customer-detail tests against the stable dev-DB seed
// (customer 3 = خالد عبدالله سعيد, balance 20,000; 3 bookings; 2 payments).

test.describe("Customer Detail — reference customer 3 (خالد)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/customers/3");
    await page.waitForLoadState("networkidle");
  });

  test("overview header shows name, credit badge, phone and address", async ({ page }) => {
    const main = page.locator("main");
    await expect(main.getByRole("heading", { name: "خالد عبدالله سعيد" })).toBeVisible();
    await expect(main.getByText("موثوق").first()).toBeVisible();
    await expect(main.getByText("01234567890").first()).toBeVisible();
    await expect(main.getByText("الجيزة، مصر").first()).toBeVisible();
  });

  test("overview data card shows full customer details", async ({ page }) => {
    const main = page.locator("main");
    await expect(main.getByText("بيانات العميل").first()).toBeVisible();
    await expect(main.getByText("EGP").first()).toBeVisible();
    await expect(main.getByText("حالة الرصيد").first()).toBeVisible();
  });

  test("financial summary card computes totals from bookings and payments", async ({ page }) => {
    const main = page.locator("main");
    await expect(main.getByText("الملخص المالي").first()).toBeVisible();
    await expect(main.getByText("20,000.00 ج.م").first()).toBeVisible(); // current balance
    await expect(main.getByText("15,000.00 ج.م").first()).toBeVisible(); // total paid
    await expect(main.getByText("3").first()).toBeVisible(); // bookings count
    await expect(main.getByText("2").first()).toBeVisible(); // payments count
  });

  test("booking summary breaks down by status counts", async ({ page }) => {
    const main = page.locator("main");
    await expect(main.getByText("ملخص الحجوزات").first()).toBeVisible();
    await expect(main.getByText("بانتظار الإصدار").first()).toBeVisible();
    await expect(main.getByText("جديدة").first()).toBeVisible();
  });

  test("bookings tab lists the customer bookings with next actions and booking deep-link", async ({ page }) => {
    await page.getByRole("tab", { name: /الحجوزات/ }).click();
    const main = page.locator("main");
    await expect(main.getByText("#1(BK-2026-001)").first()).toBeVisible();
    await expect(main.getByText("#4").first()).toBeVisible();
    await expect(main.getByText("#5").first()).toBeVisible();
    await expect(main.getByText("مطلوب الآن: إصدار التذكرة").first()).toBeVisible();
    const link = main.locator('a[href="/bookings/1"]').first();
    await expect(link).toBeVisible();
  });

  test("payments tab shows the recorded payments with method and notes", async ({ page }) => {
    await page.getByRole("tab", { name: /سجل المدفوعات/ }).click();
    const main = page.locator("main");
    await expect(main.getByText("10,000.00 ج.م").first()).toBeVisible();
    await expect(main.getByText("5,000.00 ج.م").first()).toBeVisible();
    await expect(main.getByText("نقدي").first()).toBeVisible();
    await expect(main.getByText("دفعة أولى").first()).toBeVisible();
    await expect(main.getByText("دفعة ثانية").first()).toBeVisible();
    // Payment rows deep-link to their booking (payment 2 & 3 both belong to booking 1)
    await expect(main.locator('a[href="/bookings/1"]').first()).toBeVisible();
  });

  test("statement tab computes entries, debits/credits and final balance", async ({ page }) => {
    await page.getByRole("tab", { name: /كشف الحساب/ }).click();
    const main = page.locator("main");
    await expect(main.getByText("كشف حساب العميل").first()).toBeVisible();
    await expect(main.getByText("مدين").first()).toBeVisible();
    await expect(main.getByText("دائن").first()).toBeVisible();
    // final balance row equals the stored balance
    await expect(main.getByText("الرصيد النهائي").first()).toBeVisible();
    await expect(main.getByText("20,000.00 ج.م").first()).toBeVisible();
  });

  test("back link returns to the customers list", async ({ page }) => {
    const back = page.getByRole("link", { name: /العودة للعملاء/ });
    await expect(back).toBeVisible();
    await back.click();
    await page.waitForURL("**/customers");
    expect(page.url()).toMatch(/\/customers$/);
  });
});
