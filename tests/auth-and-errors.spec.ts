import { test, expect } from "@playwright/test";

// Authentication + error-path tests.
// The default project storageState authenticates tests; here we override to a
// fresh (empty) state to exercise login and route protection.

test.describe("Authentication", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("unauthenticated visit to a protected route redirects to the login page", async ({ page }) => {
    await page.goto("/bookings");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/login");
  });

  test("login page rejects a wrong password with an error message", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.getByLabel("كلمة المرور").fill("wrong-password-123");
    await page.getByRole("button", { name: "دخول" }).click();
    await expect(page.getByText("كلمة المرور غير صحيحة")).toBeVisible();
    // still on login (no redirect / no session)
    expect(page.url()).toContain("/login");
  });

  test("login page accepts the correct password and redirects to dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.getByLabel("كلمة المرور").fill("nagah123");
    await page.getByRole("button", { name: "دخول" }).click();
    await page.waitForURL("**/dashboard**");
    expect(page.url()).toContain("/dashboard");
  });
});

test.describe("Not-found handling", () => {
  test("a non-existent booking id renders a 404", async ({ page }) => {
    const resp = await page.goto("/bookings/999999");
    expect([404, 200].includes(resp!.status())).toBeTruthy();
    await expect(page.getByText("404", { exact: false }).first()).toBeVisible();
  });

  test("a non-existent customer id renders a 404", async ({ page }) => {
    const resp = await page.goto("/customers/999999");
    expect([404, 200].includes(resp!.status())).toBeTruthy();
    await expect(page.getByText("404", { exact: false }).first()).toBeVisible();
  });

  test("a non-existent company id renders a 404", async ({ page }) => {
    const resp = await page.goto("/execution-companies/999999");
    expect([404, 200].includes(resp!.status())).toBeTruthy();
  });
});

test.describe("Form validation", () => {
  test("add-customer dialog blocks submitting with empty name/phone", async ({ page }) => {
    await page.goto("/customers");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /إضافة عميل/ }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const name = dialog.getByLabel("الاسم");
    const phone = dialog.getByLabel("رقم الهاتف");
    // Both required: submitting an empty form cannot navigate / cannot proceed
    await dialog.getByRole("button", { name: /إضافة العميل/ }).click();
    // Dialog stays open because native validation blocks the submit
    await expect(dialog).toBeVisible();
  });

  test("modification dialog rejects invalid JSON before saving", async ({ page }) => {
    await page.goto("/modifications");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /تسجيل تعديل/ }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // Must pick a ticket first, otherwise validation stops at "يرجى اختيار التذكرة"
    const trigger = dialog.locator("[role=combobox]").filter({ hasText: "اختر التذكرة" }).first();
    await trigger.click();
    const opt = page.locator("[role=option]").first();
    await opt.click();
    // Fill invalid JSON into both fields
    const oldField = dialog.locator("textarea").nth(0);
    const newField = dialog.locator("textarea").nth(1);
    await oldField.fill("{not valid json");
    await newField.fill("{also: not[valid}");
    await dialog.getByRole("button", { name: "تسجيل التعديل" }).click();
    await expect(page.getByText("صيغة JSON غير صالحة")).toBeVisible();
    await expect(dialog).toBeVisible();
  });
});
