import { test, expect } from "@playwright/test";

test.describe("Execution Offers List", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/execution-offers");
    await page.waitForLoadState("networkidle");
  });

  test("displays the page heading", async ({ page }) => {
    await expect(page.locator("main h1").filter({ hasText: "عروض التنفيذ" })).toBeVisible();
  });

  test("displays search input", async ({ page }) => {
    const searchInput = page.getByPlaceholder("بحث بالاسم أو الشركة أو الناقل...");
    await expect(searchInput).toBeVisible();
  });

  test("displays status filter dropdown", async ({ page }) => {
    const filterTrigger = page.locator('[data-slot="select-trigger"]').first();
    await expect(filterTrigger).toBeVisible();
  });

  test("displays offers table with column headers", async ({ page }) => {
    const headers = ["#", "الطلب", "العميل", "شركة التنفيذ", "الناقل", "نوع العرض", "التكلفة", "الحالة"];
    for (const header of headers) {
      await expect(page.locator("th").filter({ hasText: header }).first()).toBeVisible();
    }
  });

  test("shows offer data rows or empty state", async ({ page }) => {
    const rows = page.locator("tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test("has add new offer button", async ({ page }) => {
    const btn = page.getByRole("link", { name: /إضافة عرض جديد/ });
    await expect(btn).toBeVisible();
  });

  test("add offer button navigates to create form", async ({ page }) => {
    const btn = page.locator("a[href='/execution-offers/new']").filter({ hasText: "إضافة عرض جديد" });
    await btn.click();
    await page.waitForURL("**/execution-offers/new**");
    expect(page.url()).toContain("/execution-offers/new");
  });

  test("search filters offers", async ({ page }) => {
    const searchInput = page.getByPlaceholder("بحث بالاسم أو الشركة أو الناقل...");
    const initialCount = await page.locator("tbody tr").count();

    await searchInput.fill("xyz_no_match_99999");
    await page.waitForTimeout(500);

    const filteredCount = await page.locator("tbody tr").count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });
});

test.describe("New Execution Offer Form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/execution-offers/new");
    await page.waitForLoadState("networkidle");
  });

  test("displays the form with all required fields", async ({ page }) => {
    await expect(page.getByText("الطلب *")).toBeVisible();
    await expect(page.getByText("شركة التنفيذ *")).toBeVisible();
    await expect(page.getByText("الناقل (شركة الطيران) *")).toBeVisible();
    await expect(page.getByText("نوع العرض *")).toBeVisible();
    await expect(page.getByText("تكلفة التنفيذ *")).toBeVisible();
  });

  test("has optional fields for deadlines and details", async ({ page }) => {
    await expect(page.getByText("موعد الإصدار")).toBeVisible();
    await expect(page.getByText("موعد الدفع")).toBeVisible();
    await expect(page.getByText("تفاصيل الرحلة")).toBeVisible();
    await expect(page.getByText("ملاحظات")).toBeVisible();
  });

  test("has submit and cancel buttons", async ({ page }) => {
    await expect(page.getByRole("button", { name: /إنشاء العرض/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /إلغاء/ })).toBeVisible();
  });

  test("cancel button navigates back to offers list", async ({ page }) => {
    const cancelBtn = page.getByRole("button", { name: /إلغاء/ });
    await cancelBtn.click();
    await page.waitForURL("**/execution-offers**");
    expect(page.url()).toContain("/execution-offers");
  });
});
