import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
  });

  test("displays the dashboard heading", async ({ page }) => {
    await expect(page.locator("h1").filter({ hasText: "لوحة التحكم" })).toBeVisible();
  });

  test("displays today's date in Arabic", async ({ page }) => {
    const dateText = page.locator("text=/يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر/");
    await expect(dateText.first()).toBeVisible();
  });

  test("displays the four stat cards", async ({ page }) => {
    await expect(page.locator('[data-slot="card-title"]').getByText("حجوزات اليوم")).toBeVisible();
    await expect(page.locator('[data-slot="card-title"]').getByText("حجوزات جديدة")).toBeVisible();
    await expect(page.locator('[data-slot="card-title"]').getByText("تذاكر قريبة الرحيل", { exact: true })).toBeVisible();
    await expect(page.locator('[data-slot="card-title"]').getByText("تنبيهات مفتوحة")).toBeVisible();
  });

  test("shows new bookings section", async ({ page }) => {
    await expect(page.getByText("الحجوزات الجديدة").first()).toBeVisible();
  });

  test("shows ticketing deadlines section", async ({ page }) => {
    await expect(page.getByText("مواعيد الإصدار القادمة").first()).toBeVisible();
  });

  test("shows customers in debt section", async ({ page }) => {
    await expect(page.getByText("العملاء المدينون").first()).toBeVisible();
  });

  test("shows open alerts section", async ({ page }) => {
    await expect(page.getByText("التنبيهات المفتوحة").first()).toBeVisible();
  });

  test("has upcoming tickets link that navigates to upcoming-tickets", async ({ page }) => {
    const viewAllLink = page.locator("a[href='/upcoming-tickets']").first();
    await expect(viewAllLink).toBeVisible();
    await viewAllLink.click();
    await page.waitForURL("**/upcoming-tickets**");
    expect(page.url()).toContain("/upcoming-tickets");
  });

  test("has link to upcoming tickets full page", async ({ page }) => {
    const upcomingLink = page.locator("a[href='/upcoming-tickets']");
    const count = await upcomingLink.count();
    expect(count).toBeGreaterThanOrEqual(1);
    await upcomingLink.first().click();
    await page.waitForURL("**/upcoming-tickets**");
    expect(page.url()).toContain("/upcoming-tickets");
  });
});
