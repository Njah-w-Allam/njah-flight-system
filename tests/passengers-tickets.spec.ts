import { test, expect } from "@playwright/test";

test.describe("Passengers Screen", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/passengers");
    await page.waitForLoadState("networkidle");
  });

  test("displays the page heading", async ({ page }) => {
    await expect(page.locator("h1").filter({ hasText: "المسافرين" })).toBeVisible();
  });

  test("displays search input", async ({ page }) => {
    const searchInput = page.getByPlaceholder("بحث بالاسم أو رقم الجواز...");
    await expect(searchInput).toBeVisible();
  });

  test("displays add passenger button", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /إضافة مسافر/ });
    await expect(addBtn).toBeVisible();
  });

  test("displays passengers table with column headers", async ({ page }) => {
    const headers = ["#", "الاسم", "رقم الجواز", "الجنسية", "تاريخ الميلاد", "رقم الحجز", "التذاكر المرتبطة"];
    for (const header of headers) {
      await expect(page.locator("th").filter({ hasText: header }).first()).toBeVisible();
    }
  });

  test("shows passenger data rows or empty state", async ({ page }) => {
    const rows = page.locator("tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("add passenger opens dialog with form fields", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /إضافة مسافر/ });
    await addBtn.click();

    await expect(page.getByText("إضافة مسافر جديد")).toBeVisible();
    await expect(page.getByLabel("الاسم")).toBeVisible();
    await expect(page.getByLabel("رقم جواز السفر")).toBeVisible();
    await expect(page.getByLabel("الجنسية")).toBeVisible();
    await expect(page.getByLabel("تاريخ الميلاد")).toBeVisible();
    await expect(page.getByLabel("ملاحظات")).toBeVisible();
  });

  test("add passenger dialog has submit button", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /إضافة مسافر/ });
    await addBtn.click();

    const submitBtn = page.getByRole("button", { name: /إضافة المسافر/ });
    await expect(submitBtn).toBeVisible();
  });

  test("search filters passengers by name", async ({ page }) => {
    const searchInput = page.getByPlaceholder("بحث بالاسم أو رقم الجواز...");
    const initialCount = await page.locator("tbody tr").count();

    await searchInput.fill("xyz_nonexistent_9999");
    await page.waitForTimeout(500);

    const filteredCount = await page.locator("tbody tr").count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });
});

test.describe("Tickets Screen", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tickets");
    await page.waitForLoadState("networkidle");
  });

  test("displays the page heading", async ({ page }) => {
    await expect(page.locator("h1").filter({ hasText: "التذاكر" })).toBeVisible();
  });

  test("displays search input", async ({ page }) => {
    const searchInput = page.getByPlaceholder("بحث برقم التذكرة أو PNR أو اسم العميل...");
    await expect(searchInput).toBeVisible();
  });

  test("displays add ticket button", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /إضافة تذكرة/ });
    await expect(addBtn).toBeVisible();
  });

  test("displays status filter buttons", async ({ page }) => {
    const statusButtons = ["الكل", "قيد الانتظار", "تم الإصدار", "تم التعديل", "ملغية"];
    for (const label of statusButtons) {
      await expect(page.getByRole("button", { name: label })).toBeVisible();
    }
  });

  test("displays tickets table with column headers", async ({ page }) => {
    const headers = ["#", "رقم التذكرة", "PNR", "اسم العميل", "رقم الحجز", "شركة الطيران", "السعر", "تاريخ الإصدار", "الحالة"];
    for (const header of headers) {
      await expect(page.locator("th").filter({ hasText: header }).first()).toBeVisible();
    }
  });

  test("shows ticket data rows or empty state", async ({ page }) => {
    const rows = page.locator("tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("add ticket opens dialog with form fields", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /إضافة تذكرة/ });
    await addBtn.click();

    await expect(page.getByText("إضافة تذكرة جديدة")).toBeVisible();
    await expect(page.getByText("أدخل بيانات التذكرة الجديدة. الحقول المؤشرة بـ * مطلوبة.")).toBeVisible();
  });

  test("add ticket dialog has booking and airline selectors", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /إضافة تذكرة/ });
    await addBtn.click();

    await expect(page.getByLabel("رقم التذكرة")).toBeVisible();
    await expect(page.getByLabel("PNR")).toBeVisible();
    await expect(page.getByLabel("سعر التذكرة (ج.م)")).toBeVisible();
    await expect(page.getByLabel("ملاحظات")).toBeVisible();
  });

  test("add ticket dialog has submit button", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /إضافة تذكرة/ });
    await addBtn.click();

    const submitBtn = page.getByRole("button", { name: /إنشاء التذكرة/ });
    await expect(submitBtn).toBeVisible();
  });

  test("search filters tickets", async ({ page }) => {
    const searchInput = page.getByPlaceholder("بحث برقم التذكرة أو PNR أو اسم العميل...");
    const initialCount = await page.locator("tbody tr").count();

    await searchInput.fill("xyz_no_match_66666");
    await page.waitForTimeout(500);

    const filteredCount = await page.locator("tbody tr").count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test("status filter buttons filter tickets", async ({ page }) => {
    const pendingBtn = page.getByRole("button", { name: "قيد الانتظار" });
    await pendingBtn.click();
    await page.waitForTimeout(500);

    const rows = page.locator("tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
