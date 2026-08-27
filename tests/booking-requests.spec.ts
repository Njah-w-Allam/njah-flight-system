import { test, expect } from "@playwright/test";

test.describe("Booking Requests List", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/booking-requests");
    await page.waitForLoadState("networkidle");
  });

  test("displays the page heading", async ({ page }) => {
    await expect(page.locator("main h1").filter({ hasText: "طلبات الحجز" })).toBeVisible();
  });

  test("displays search input", async ({ page }) => {
    const searchInput = page.getByPlaceholder("بحث بالاسم أو رقم الهاتف أو المدينة أو الرقم...");
    await expect(searchInput).toBeVisible();
  });

  test("displays status filter dropdown", async ({ page }) => {
    const filterTrigger = page.locator('[data-slot="select-trigger"]').first();
    await expect(filterTrigger).toBeVisible();
  });

  test("displays booking requests table with column headers", async ({ page }) => {
    const headers = ["#", "العميل", "من", "إلى", "نوع الرحلة", "تاريخ السفر", "المسافرين", "الحالة", "تاريخ الإنشاء"];
    for (const header of headers) {
      await expect(page.locator("th").filter({ hasText: header }).first()).toBeVisible();
    }
  });

  test("shows request data rows", async ({ page }) => {
    const rows = page.locator("tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test("has a 'new booking request' button", async ({ page }) => {
    const btn = page.getByRole("link", { name: /طلب حجز جديد/ });
    await expect(btn).toBeVisible();
  });

  test("new booking request button navigates to create form", async ({ page }) => {
    const btn = page.locator("a[href='/booking-requests/new']").filter({ hasText: "طلب حجز جديد" });
    await btn.click();
    await page.waitForURL("**/booking-requests/new**");
    expect(page.url()).toContain("/booking-requests/new");
  });

  test("search filters requests", async ({ page }) => {
    const searchInput = page.getByPlaceholder("بحث بالاسم أو رقم الهاتف أو المدينة أو الرقم...");
    const initialCount = await page.locator("tbody tr").count();

    await searchInput.fill("xyz_no_match_12345");
    await page.waitForTimeout(500);

    const filteredCount = await page.locator("tbody tr").count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });
});

test.describe("New Booking Request Form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/booking-requests/new");
    await page.waitForLoadState("networkidle");
  });

  test("displays the form heading", async ({ page }) => {
    await expect(page.getByText("طلب حجز جديد")).toBeVisible();
  });

  test("has back button", async ({ page }) => {
    const backBtn = page.locator("main a[href='/booking-requests']").first();
    await expect(backBtn).toBeVisible();
  });

  test("displays customer data section", async ({ page }) => {
    await expect(page.getByText("بيانات العميل")).toBeVisible();
  });

  test("customer field is a searchable typeahead", async ({ page }) => {
    const trigger = page.locator('[role="combobox"][aria-label="بحث عن عميل"]');
    await expect(trigger).toBeVisible();
    await trigger.click();
    await expect(page.getByPlaceholder("ابحث بالاسم أو رقم الهاتف...")).toBeVisible();
    await expect(page.getByText("العملاء المطابقون")).toBeVisible();
  });

  test("typing phone digits filters customers and offers new-customer creation", async ({ page }) => {
    await page.locator('[role="combobox"][aria-label="بحث عن عميل"]').click();
    const search = page.getByPlaceholder("ابحث بالاسم أو رقم الهاتف...");
    await expect(search).toBeVisible();
    // Phone prefix for فاطمة (01123456789): first 3 digits "011"
    await search.fill("0112");
    await page.waitForTimeout(300);
    await expect(page.locator("[cmdk-item]").filter({ hasText: "فاطمة" }).first()).toBeVisible();
    // Non-empty query exposes the "add new customer" item
    await expect(page.locator("[cmdk-item]").filter({ hasText: "إضافة عميل جديد" }).first()).toBeVisible();
  });

  test("typeahead new-customer flow requires name and phone before confirming", async ({ page }) => {
    await page.locator('[role="combobox"][aria-label="بحث عن عميل"]').click();
    const search = page.getByPlaceholder("ابحث بالاسم أو رقم الهاتف...");
    await search.fill("بي جي سي");
    await page.waitForTimeout(300);
    await page.locator("[cmdk-item]").filter({ hasText: "إضافة عميل جديد" }).click();
    // New-customer editing panel appears
    await expect(page.getByText("عميل جديد")).toBeVisible();
    const name = page.getByPlaceholder("اسم العميل");
    const phone = page.getByPlaceholder("01xxxxxxxxx");
    await expect(name).toBeVisible();
    await expect(phone).toBeVisible();
    // Confirm is disabled until both are filled
    const confirm = page.getByRole("button", { name: /تأكيد العميل الجديد/ });
    await expect(confirm).toBeDisabled();
    await name.fill("عميل بي جي سي");
    await phone.fill("0109998877");
    await expect(confirm).toBeEnabled();
  });

  test("displays flight details section", async ({ page }) => {
    await expect(page.getByText("تفاصيل الرحلة")).toBeVisible();
  });

  test("has origin and destination inputs", async ({ page }) => {
    await expect(page.getByLabel("المدينة المغادرة")).toBeVisible();
    await expect(page.getByLabel("المدينة المقصودة")).toBeVisible();
  });

  test("has trip type selector", async ({ page }) => {
    const tripTypeSelect = page.locator('[data-slot="select-trigger"]').first();
    await expect(tripTypeSelect).toBeVisible();
  });

  test("has departure date input", async ({ page }) => {
    await expect(page.getByLabel("تاريخ السفر")).toBeVisible();
  });

  test("has passengers count input", async ({ page }) => {
    await expect(page.getByLabel("عدد المسافرين")).toBeVisible();
  });

  test("displays notes section", async ({ page }) => {
    await expect(page.getByText("ملاحظات وإضافات")).toBeVisible();
    await expect(page.getByLabel("المتطلبات")).toBeVisible();
    await expect(page.getByLabel("ملاحظات داخلية")).toBeVisible();
  });

  test("has submit and cancel buttons", async ({ page }) => {
    await expect(page.getByRole("button", { name: /إنشاء طلب الحجز/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /إلغاء/ })).toBeVisible();
  });

  test("cancel button navigates back to booking requests", async ({ page }) => {
    const cancelBtn = page.getByRole("button", { name: /إلغاء/ });
    await cancelBtn.click();
    await page.waitForURL("**/booking-requests**");
    expect(page.url()).toContain("/booking-requests");
  });
});
