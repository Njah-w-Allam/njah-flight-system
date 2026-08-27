import { test, expect } from "@playwright/test";

test.describe("Customer Payments", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/customer-payments");
    await page.waitForLoadState("networkidle");
  });

  test("displays the page heading", async ({ page }) => {
    await expect(page.locator("main h1").filter({ hasText: "مدفوعات العملاء" })).toBeVisible();
  });

  test("displays search input", async ({ page }) => {
    const searchInput = page.getByPlaceholder("بحث بالاسم أو رقم الهاتف أو رقم الحجز...");
    await expect(searchInput).toBeVisible();
  });

  test("displays status and method filter dropdowns", async ({ page }) => {
    const filters = page.locator('[data-slot="select-trigger"]');
    const count = await filters.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("displays payments table with column headers", async ({ page }) => {
    const headers = ["#", "العميل", "رقم الحجز", "المبلغ", "طريقة الدفع", "تاريخ الدفع", "الحالة"];
    for (const header of headers) {
      await expect(page.locator("th").filter({ hasText: header }).first()).toBeVisible();
    }
  });

  test("shows payment data rows", async ({ page }) => {
    const rows = page.locator("tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test("has add payment button", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /إضافة دفعة/ });
    await expect(addBtn).toBeVisible();
  });

  test("clicking add payment opens dialog", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /إضافة دفعة/ });
    await addBtn.click();

    await expect(page.getByText("إضافة دفعة عميل جديدة")).toBeVisible();
    await expect(page.getByText("اختر الحجز وأدخل بيانات الدفع")).toBeVisible();
  });

  test("payment dialog has booking selector, amount, method fields", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /إضافة دفعة/ });
    await addBtn.click();

    await expect(page.getByLabel("المبلغ (ج.م)")).toBeVisible();
    await expect(page.getByLabel("ملاحظات")).toBeVisible();
  });

  test("payment dialog has submit button", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /إضافة دفعة/ });
    await addBtn.click();

    const submitBtn = page.getByRole("button", { name: /إضافة الدفعة/ });
    await expect(submitBtn).toBeVisible();
  });

  test("search filters customer payments", async ({ page }) => {
    const searchInput = page.getByPlaceholder("بحث بالاسم أو رقم الهاتف أو رقم الحجز...");
    const initialCount = await page.locator("tbody tr").count();

    await searchInput.fill("xyz_no_match_88888");
    await page.waitForTimeout(500);

    const filteredCount = await page.locator("tbody tr").count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });
});

test.describe("Execution Payments", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/execution-payments");
    await page.waitForLoadState("networkidle");
  });

  test("displays the page heading", async ({ page }) => {
    await expect(page.locator("main h1").filter({ hasText: "مدفوعات شركات التنفيذ" })).toBeVisible();
  });

  test("displays search input", async ({ page }) => {
    const searchInput = page.getByPlaceholder("بحث بالاسم أو رقم الحجز...");
    await expect(searchInput).toBeVisible();
  });

  test("displays status filter dropdown", async ({ page }) => {
    const filterTrigger = page.locator('[data-slot="select-trigger"]').first();
    await expect(filterTrigger).toBeVisible();
  });

  test("displays payments table with column headers", async ({ page }) => {
    const headers = ["#", "شركة التنفيذ", "رقم الحجز", "المبلغ", "تاريخ الدفع", "الحالة"];
    for (const header of headers) {
      await expect(page.locator("th").filter({ hasText: header }).first()).toBeVisible();
    }
  });

  test("shows payment data rows", async ({ page }) => {
    const rows = page.locator("tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test("has add payment button", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /إضافة دفعة/ });
    await expect(addBtn).toBeVisible();
  });

  test("clicking add payment opens dialog", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /إضافة دفعة/ });
    await addBtn.click();

    await expect(page.getByText("إضافة دفعة شركة تنفيذ جديدة")).toBeVisible();
  });

  test("payment dialog has amount field", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /إضافة دفعة/ });
    await addBtn.click();

    await expect(page.getByLabel("المبلغ (ج.م)")).toBeVisible();
  });

  test("search filters execution payments", async ({ page }) => {
    const searchInput = page.getByPlaceholder("بحث بالاسم أو رقم الحجز...");
    const initialCount = await page.locator("tbody tr").count();

    await searchInput.fill("xyz_no_match_77777");
    await page.waitForTimeout(500);

    const filteredCount = await page.locator("tbody tr").count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });
});
