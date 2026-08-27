import { test, expect } from "@playwright/test";

test.describe("Customers List", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/customers");
    await page.waitForLoadState("networkidle");
  });

  test("displays the page heading", async ({ page }) => {
    await expect(page.locator("main h1").filter({ hasText: "العملاء" })).toBeVisible();
  });

  test("displays search input", async ({ page }) => {
    const searchInput = page.getByPlaceholder("بحث بالاسم أو رقم الهاتف...");
    await expect(searchInput).toBeVisible();
  });

  test("displays add customer button", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /إضافة عميل/ });
    await expect(addBtn).toBeVisible();
  });

  test("displays customers table with column headers", async ({ page }) => {
    const headers = ["#", "الاسم", "الهاتف", "العنوان", "الرصيد", "حالة الرصيد", "الحجوزات", "المدفوعات", "تاريخ التسجيل"];
    for (const header of headers) {
      await expect(page.locator("th").filter({ hasText: header }).first()).toBeVisible();
    }
  });

  test("shows customer data rows", async ({ page }) => {
    const rows = page.locator("tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test("search filters customers by name", async ({ page }) => {
    const searchInput = page.getByPlaceholder("بحث بالاسم أو رقم الهاتف...");
    await searchInput.fill("أحمد");
    await page.waitForTimeout(500);

    const rows = page.locator("tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("each customer row has a view details button", async ({ page }) => {
    const detailLinks = page.locator("a[href^='/customers/']");
    const count = await detailLinks.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe("Add Customer Dialog", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/customers");
    await page.waitForLoadState("networkidle");
  });

  test("clicking add customer opens dialog", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /إضافة عميل/ });
    await addBtn.click();

    await expect(page.getByText("إضافة عميل جديد")).toBeVisible();
    await expect(page.getByText("أدخل بيانات العميل الجديد. الحقول المؤشرة بـ * مطلوبة.")).toBeVisible();
  });

  test("add customer dialog has all form fields", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /إضافة عميل/ });
    await addBtn.click();

    await expect(page.getByLabel("الاسم")).toBeVisible();
    await expect(page.getByLabel("رقم الهاتف")).toBeVisible();
    await expect(page.getByLabel("العنوان")).toBeVisible();
    await expect(page.getByLabel("ملاحظات")).toBeVisible();
  });

  test("add customer dialog has submit button", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /إضافة عميل/ });
    await addBtn.click();

    const submitBtn = page.getByRole("button", { name: /إضافة العميل/ });
    await expect(submitBtn).toBeVisible();
  });

  test("name and phone fields are required", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /إضافة عميل/ });
    await addBtn.click();

    const nameInput = page.getByLabel("الاسم");
    const phoneInput = page.getByLabel("رقم الهاتف");

    expect(await nameInput.getAttribute("required")).not.toBeNull();
    expect(await phoneInput.getAttribute("required")).not.toBeNull();
  });

  test("dialog can be closed", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /إضافة عميل/ });
    await addBtn.click();
    await expect(page.getByText("إضافة عميل جديد")).toBeVisible();

    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    await expect(page.getByText("إضافة عميل جديد")).not.toBeVisible();
  });
});

test.describe("Customer Detail Page", () => {
  test("navigates to customer detail from list", async ({ page }) => {
    await page.goto("/customers");
    await page.waitForLoadState("networkidle");

    const detailLink = page.locator("a[href^='/customers/']").first();
    if (await detailLink.isVisible()) {
      const href = await detailLink.getAttribute("href");
      await detailLink.click();
      await page.waitForURL(`**${href}**`);
      expect(page.url()).toContain("/customers/");
    }
  });

  test("customer detail shows customer name as heading", async ({ page }) => {
    await page.goto("/customers");
    await page.waitForLoadState("networkidle");

    const detailLink = page.locator("a[href^='/customers/']").first();
    if (await detailLink.isVisible()) {
      await detailLink.click();
      await page.waitForURL("**/customers/**");

      const heading = page.locator("h1").first();
      await expect(heading).toBeVisible();
    }
  });

  test("customer detail has tabs for overview, bookings, payments, statement", async ({ page }) => {
    await page.goto("/customers");
    await page.waitForLoadState("networkidle");

    const detailLink = page.locator("a[href^='/customers/']").first();
    if (await detailLink.isVisible()) {
      await detailLink.click();
      await page.waitForURL("**/customers/**");

      await expect(page.getByRole("tab", { name: /نظرة عامة/ })).toBeVisible();
      await expect(page.getByRole("tab", { name: /الحجوزات/ })).toBeVisible();
      await expect(page.getByRole("tab", { name: /سجل المدفوعات/ })).toBeVisible();
      await expect(page.getByRole("tab", { name: /كشف الحساب/ })).toBeVisible();
    }
  });

  test("customer detail overview shows financial summary", async ({ page }) => {
    await page.goto("/customers");
    await page.waitForLoadState("networkidle");

    const detailLink = page.locator("a[href^='/customers/']").first();
    if (await detailLink.isVisible()) {
      await detailLink.click();
      await page.waitForURL("**/customers/**");

      await expect(page.getByText("بيانات العميل").first()).toBeVisible();
      await expect(page.getByText("الملخص المالي").first()).toBeVisible();
    }
  });

  test("customer detail has back to customers link", async ({ page }) => {
    await page.goto("/customers");
    await page.waitForLoadState("networkidle");

    const detailLink = page.locator("a[href^='/customers/']").first();
    if (await detailLink.isVisible()) {
      await detailLink.click();
      await page.waitForURL("**/customers/**");

      const backLink = page.getByRole("link", { name: /العودة للعملاء/ });
      await expect(backLink).toBeVisible();
    }
  });
});
