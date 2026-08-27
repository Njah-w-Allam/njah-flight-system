import { test, expect } from "@playwright/test";

test.describe("Execution Companies List", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/execution-companies");
    await page.waitForLoadState("networkidle");
  });

  test("displays the page heading", async ({ page }) => {
    await expect(page.locator("main h1").filter({ hasText: "شركات التنفيذ" })).toBeVisible();
  });

  test("displays search input", async ({ page }) => {
    const searchInput = page.getByPlaceholder("بحث بالاسم...");
    await expect(searchInput).toBeVisible();
  });

  test("displays add company button", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /إضافة شركة تنفيذ/ });
    await expect(addBtn).toBeVisible();
  });

  test("displays companies table with column headers", async ({ page }) => {
    const headers = ["#", "اسم الشركة", "جهة الاتصال", "الهاتف", "الرصيد", "العروض", "الحجوزات", "المدفوعات"];
    for (const header of headers) {
      await expect(page.locator("th").filter({ hasText: header }).first()).toBeVisible();
    }
  });

  test("shows company data rows", async ({ page }) => {
    const rows = page.locator("tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test("search filters companies by name", async ({ page }) => {
    const searchInput = page.getByPlaceholder("بحث بالاسم...");
    await searchInput.fill("شركة");
    await page.waitForTimeout(500);

    const rows = page.locator("tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("each company row has a view details button", async ({ page }) => {
    const detailLinks = page.locator("a[href^='/execution-companies/']");
    const count = await detailLinks.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe("Add Execution Company Dialog", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/execution-companies");
    await page.waitForLoadState("networkidle");
  });

  test("clicking add company opens dialog", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /إضافة شركة تنفيذ/ });
    await addBtn.click();

    await expect(page.getByText("إضافة شركة تنفيذ جديدة")).toBeVisible();
  });

  test("dialog has company name field (required)", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /إضافة شركة تنفيذ/ });
    await addBtn.click();

    const nameInput = page.locator("#name");
    await expect(nameInput).toBeVisible();
    expect(await nameInput.getAttribute("required")).not.toBeNull();
  });

  test("dialog has optional contact person and phone fields", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /إضافة شركة تنفيذ/ });
    await addBtn.click();

    await expect(page.locator("#contact_person")).toBeVisible();
    await expect(page.locator("#phone")).toBeVisible();
    await expect(page.locator("#address")).toBeVisible();
  });

  test("dialog has submit button", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /إضافة شركة تنفيذ/ });
    await addBtn.click();

    const submitBtn = page.getByRole("button", { name: /إضافة$/ });
    await expect(submitBtn).toBeVisible();
  });
});

test.describe("Execution Company Detail Page", () => {
  test("navigates to company detail from list", async ({ page }) => {
    await page.goto("/execution-companies");
    await page.waitForLoadState("networkidle");

    const detailLink = page.locator("a[href^='/execution-companies/']").first();
    if (await detailLink.isVisible()) {
      const href = await detailLink.getAttribute("href");
      await detailLink.click();
      await page.waitForURL(`**${href}**`);
      expect(page.url()).toContain("/execution-companies/");
    }
  });

  test("company detail has tabs", async ({ page }) => {
    await page.goto("/execution-companies");
    await page.waitForLoadState("networkidle");

    const detailLink = page.locator("a[href^='/execution-companies/']").first();
    if (await detailLink.isVisible()) {
      await detailLink.click();
      await page.waitForURL("**/execution-companies/**");

      const tabs = page.locator('[role="tab"]');
      const tabCount = await tabs.count();
      expect(tabCount).toBeGreaterThanOrEqual(2);
    }
  });
});
