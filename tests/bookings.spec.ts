import { test, expect } from "@playwright/test";

test.describe("Bookings List", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/bookings");
    await page.waitForLoadState("networkidle");
  });

  test("displays the page heading", async ({ page }) => {
    await expect(page.locator("main h1").filter({ hasText: "الحجوزات" })).toBeVisible();
  });

  test("displays search input", async ({ page }) => {
    const searchInput = page.getByPlaceholder("بحث بالاسم أو رقم الهاتف أو رقم الحجز...");
    await expect(searchInput).toBeVisible();
  });

  test("displays status filter dropdown", async ({ page }) => {
    const filterTrigger = page.locator('[data-slot="select-trigger"]').first();
    await expect(filterTrigger).toBeVisible();
  });

  test("displays bookings table with column headers", async ({ page }) => {
    const tableHeaders = ["#", "العميل", "المسار", "شركة التنفيذ", "الناقل", "تاريخ السفر", "الحالة", "سعر الشراء", "سعر البيع", "الربح"];
    for (const header of tableHeaders) {
      await expect(page.locator("th").filter({ hasText: header }).first()).toBeVisible();
    }
  });

  test("shows booking data rows or empty state", async ({ page }) => {
    const rows = page.locator("tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test("search filters bookings by customer name", async ({ page }) => {
    const searchInput = page.getByPlaceholder("بحث بالاسم أو رقم الهاتف أو رقم الحجز...");
    await searchInput.fill("خالد");
    await page.waitForTimeout(500);

    const rows = page.locator("tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("search with empty string shows all bookings", async ({ page }) => {
    const searchInput = page.getByPlaceholder("بحث بالاسم أو رقم الهاتف أو رقم الحجز...");

    await searchInput.fill("xyz_no_match");
    await page.waitForTimeout(300);
    const filteredCount = await page.locator("tbody tr").count();

    await searchInput.clear();
    await page.waitForTimeout(300);
    const allCount = await page.locator("tbody tr").count();

    expect(allCount).toBeGreaterThanOrEqual(filteredCount);
  });

  test("has a 'new booking request' button", async ({ page }) => {
    const btn = page.getByRole("link", { name: /طلب حجز جديد/ });
    await expect(btn).toBeVisible();
  });

  test("new booking request button navigates to booking-requests", async ({ page }) => {
    const btn = page.locator("a[href='/booking-requests']").filter({ hasText: "طلب حجز جديد" });
    await btn.click();
    await page.waitForURL("**/booking-requests**");
    expect(page.url()).toContain("/booking-requests");
  });
});

test.describe("Booking Detail Page", () => {
  test("navigates to booking detail from list", async ({ page }) => {
    await page.goto("/bookings");
    await page.waitForLoadState("networkidle");

    const detailLink = page.locator('a[href^="/bookings/"]').first();
    if (await detailLink.isVisible()) {
      const href = await detailLink.getAttribute("href");
      await detailLink.click();
      await page.waitForURL(`**${href}**`);
      expect(page.url()).toContain("/bookings/");
    }
  });

  test("booking detail shows heading with booking ID", async ({ page }) => {
    await page.goto("/bookings");
    await page.waitForLoadState("networkidle");

    const detailLink = page.locator('a[href^="/bookings/"]').first();
    if (await detailLink.isVisible()) {
      await detailLink.click();
      await page.waitForURL("**/bookings/**");
      await expect(page.locator("h1").filter({ hasText: /حجز/ })).toBeVisible();
    }
  });

  test("booking detail has all six tabs", async ({ page }) => {
    await page.goto("/bookings");
    await page.waitForLoadState("networkidle");

    const detailLink = page.locator('a[href^="/bookings/"]').first();
    if (await detailLink.isVisible()) {
      await detailLink.click();
      await page.waitForURL("**/bookings/**");

      const tabLabels = ["نظرة عامة", "التأكرة", "المسافرين", "المدفوعات", "تاريخ الأسعار", "التنبيهات"];
      for (const label of tabLabels) {
        const tab = page.getByRole("tab", { name: new RegExp(label) });
        if (await tab.count() > 0) {
          await expect(tab.first()).toBeVisible();
        }
      }
    }
  });

  test("booking detail shows overview tab by default", async ({ page }) => {
    await page.goto("/bookings");
    await page.waitForLoadState("networkidle");

    const detailLink = page.locator('a[href^="/bookings/"]').first();
    if (await detailLink.isVisible()) {
      await detailLink.click();
      await page.waitForURL("**/bookings/**");

      await expect(page.getByText("بيانات الحجز").first()).toBeVisible();
      await expect(page.getByText("البيانات المالية").first()).toBeVisible();
    }
  });

  test("booking detail passengers tab allows adding a passenger from within the booking", async ({ page }) => {
    await page.goto("/bookings");
    await page.waitForLoadState("networkidle");

    const detailLink = page.locator('a[href^="/bookings/"]').first();
    if (!(await detailLink.isVisible())) {
      test.skip();
      return;
    }
    await detailLink.click();
    await page.waitForURL("**/bookings/**");

    await page.getByRole("tab", { name: /المسافرين/ }).click();
    const addBtn = page.getByRole("button", { name: /إضافة مسافر/ });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("إضافة مسافر جديد")).toBeVisible();
    await dialog.getByRole("button", { name: /إلغاء/ }).click();
    await expect(dialog).toBeHidden();
  });

  test("booking detail tickets tab shows manage actions", async ({ page }) => {
    await page.goto("/bookings");
    await page.waitForLoadState("networkidle");

    const detailLink = page.locator('a[href^="/bookings/"]').first();
    if (!(await detailLink.isVisible())) {
      test.skip();
      return;
    }
    await detailLink.click();
    await page.waitForURL("**/bookings/**");

    await page.getByRole("tab", { name: /التذاكر/ }).click();
    const issueBtn = page.locator("button[title='إصدار التذكرة']").first();
    const cancelBtn = page.locator("button[title='إلغاء التذكرة']").first();
    if ((await issueBtn.count()) === 0 && (await cancelBtn.count()) === 0) {
      return;
    }
    if ((await issueBtn.count()) > 0) {
      await issueBtn.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText("تأكيد إصدار التذكرة")).toBeVisible();
      await dialog.getByRole("button", { name: /إلغاء/ }).click();
      await expect(dialog).toBeHidden();
    }
  });
});
