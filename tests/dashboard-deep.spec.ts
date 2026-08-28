import { test, expect } from "@playwright/test";

// Deep, data-aware dashboard tests against the stable dev-DB seed.
// The dashboard is date-sensitive in parts (today counts) — those parts are
// asserted structurally, while stable data (debtors, in-progress names/routes)
// is asserted concretely.

test.describe("Dashboard — deep sections", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
  });

  test("shows quick-actions strip with all five primary actions", async ({ page }) => {
    await expect(page.locator("main").getByText("إجراءات سريعة").first()).toBeVisible();
    for (const label of ["+ حجز جديد", "+ إضافة عميل", "+ تسجيل دفعة", "+ تسجيل تذكرة", "+ إضافة عرض"]) {
      await expect(page.locator("main").getByRole("button", { name: label }).first()).toBeVisible();
    }
  });

  test("new booking quick action opens a modal titled حجز جديد", async ({ page }) => {
    await page.locator("main").getByRole("button", { name: "+ حجز جديد" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "حجز جديد" })).toBeVisible();
    await expect(dialog.locator('input[name="depart_date"]')).toBeVisible();
    await expect(dialog.locator('input[name="passengers_count"]')).toBeVisible();
  });

  test("in-progress work section lists known waiting dispatched requests", async ({ page }) => {
    const section = page.locator("main").getByText("العمليات قيد التنفيذ").first();
    await expect(section).toBeVisible();
    // A waiting request row references the customer and shows the follow-up CTA
    await expect(page.getByText("بانتظار عروض التنفيذ").first()).toBeVisible();
    const follow = page.locator("a[href*='/execution-offers?request=']").first();
    await expect(follow).toBeVisible();
    await expect(follow.getByRole("button", { name: "متابعة" })).toBeVisible();
  });

  test("in-progress work deep-links a booking row to its detail page", async ({ page }) => {
    const bookingFollow = page.locator("a[href^='/bookings/']").filter({
      has: page.locator("button", { hasText: "متابعة" }),
    }).first();
    await expect(bookingFollow).toBeVisible();
  });

  test("customers-in-debt section totals the known debtor balances", async ({ page }) => {
    const main = page.locator("main");
    await expect(main.getByText("العملاء المدينون").first()).toBeVisible();
    // Seed balances: فاطمة 40,000 + خالد 20,000 = 60,000
    await expect(main.getByText("60,000.00 ج.م").first()).toBeVisible();
    await expect(main.getByText("40,000.00 ج.م").first()).toBeVisible();
    await expect(main.getByText("20,000.00 ج.م").first()).toBeVisible();
  });

  test("debtor rows deep-link to the customer detail page", async ({ page }) => {
    const debtorLink = page.locator("a[href^='/customers/']").filter({
      has: page.locator("span", { hasText: "40,000.00 ج.م" }),
    }).first();
    await expect(debtorLink).toBeVisible();
    const href = await debtorLink.getAttribute("href");
    expect(href).toMatch(/^\/customers\/\d+$/);
  });

  test("new bookings section deep-links each NEW booking to its detail", async ({ page }) => {
    const sectionLink = page.locator("a[href^='/bookings/']").filter({
      has: page.locator("span", { hasText: "#" }),
    }).first();
    await expect(sectionLink).toBeVisible();
    await sectionLink.click();
    await page.waitForURL(/\/bookings\/\d+/);
    expect(page.url()).toMatch(/\/bookings\/\d+/);
  });

  test("heading shows the dashboard title and the four stat cards", async ({ page }) => {
    const main = page.locator("main");
    await expect(main.getByRole("heading", { name: "لوحة التحكم" })).toBeVisible();
    await expect(page.getByText("حجوزات اليوم").first()).toBeVisible();
    await expect(page.getByText("حجوزات جديدة (غير مؤكدة)").first()).toBeVisible();
    await expect(page.getByText("تذاكر قريبة الرحيل").first()).toBeVisible();
    await expect(page.getByText("تنبيهات مفتوحة").first()).toBeVisible();
  });

  test("stat card values render as numerals", async ({ page }) => {
    // Wait for the stat cards to be populated and assert value cards exist
    const warnCard = page.locator('[data-slot="card"]').filter({ hasText: "حجوزات جديدة (غير مؤكدة)" }).first();
    await expect(warnCard.getByText(/^\d+$/).first()).toBeVisible();
  });
});
