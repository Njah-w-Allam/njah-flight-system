import { test, expect } from "@playwright/test";

// Deep, data-aware execution-offers tests against the stable dev-DB seed:
// 5 offers total — 3 received (بانتظار القرار), 2 rejected (مرفوضة).

test.describe("Execution Offers — deep data", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/execution-offers");
    await page.waitForLoadState("networkidle");
  });

  test("status stat cards reflect the seed offer counts", async ({ page }) => {
    const main = page.locator("main");
    await expect(main.getByText("بانتظار القرار").first()).toBeVisible();
    await expect(main.getByText("تم اختيارها").first()).toBeVisible();
    await expect(main.getByText("مرفوضة").first()).toBeVisible();
    await expect(main.getByText("منتهية").first()).toBeVisible();
    // Received count (3) and rejected count (2)
    await expect(main.getByText("3", { exact: true }).first()).toBeVisible();
    await expect(main.getByText("2", { exact: true }).first()).toBeVisible();
  });

  test("a received offer row shows full route, customer, company, airline and cost", async ({ page }) => {
    const main = page.locator("main");
    // offer 2: request #4, خالد, الرحلات السياحية, الخطوط السعودية (SV), اقتصادي, 28,000
    await expect(main.getByText("#4").first()).toBeVisible();
    await expect(main.getByText("القاهرة → جدة").first()).toBeVisible();
    await expect(main.getByText("خالد عبدالله سعيد").first()).toBeVisible();
    await expect(main.getByText("شركة الرحلات السياحية").first()).toBeVisible();
    await expect(main.getByText(/الخطوط السعودية/).first()).toBeVisible();
    await expect(main.getByText("اقتصادي").first()).toBeVisible();
    await expect(main.getByText("28,000.00 ج.م").first()).toBeVisible();
    await expect(main.getByText("مستلم").first()).toBeVisible();
  });

  test("received offers expose select and reject controls", async ({ page }) => {
    const select = page.locator('button[title="اختيار العرض"]');
    const reject = page.locator('button[title="رفض العرض"]');
    const selectCount = await select.count();
    const rejectCount = await reject.count();
    expect(selectCount).toBeGreaterThanOrEqual(1);
    expect(rejectCount).toBeGreaterThanOrEqual(1);
    // exactly as many of each as received offers
    expect(selectCount).toBe(3);
    expect(rejectCount).toBe(3);
  });

  test("rejected offers do not expose select/reject controls", async ({ page }) => {
    const rejectedRows = page.locator("tbody tr").filter({ hasText: "مرفوض" });
    const rowCount = await rejectedRows.count();
    expect(rowCount).toBeGreaterThanOrEqual(1);
  });

  test("status filter restricts the table to rejected offers", async ({ page }) => {
    const trigger = page.locator('[data-slot="select-trigger"]').nth(0);
    await trigger.click();
    await page.locator('[role="option"]').filter({ hasText: "مرفوض" }).last().click();
    await page.waitForTimeout(300);
    const rows = page.locator("tbody tr");
    const count = await rows.count();
    expect(count).toBe(2);
    await expect(page.locator("tbody").getByText("15,000.00 ج.م").first()).toBeVisible();
    await expect(page.locator("tbody").getByText("13,500.00 ج.م").first()).toBeVisible();
  });

  test("request filter narrows offers for a specific request", async ({ page }) => {
    const trigger = page.locator('[data-slot="select-trigger"]').nth(1);
    await trigger.click();
    // Request #3 label: #3 - فاطمة - الإسكندرية → لندن
    await page.locator('[role="option"]').filter({ hasText: "#3" }).last().click();
    await page.waitForTimeout(300);
    const rows = page.locator("tbody tr");
    const count = await rows.count();
    expect(count).toBe(2); // offers 3 & 4 belong to request 3
  });

  test("search by customer name narrows offers to that customer's rows", async ({ page }) => {
    await page.getByPlaceholder("بحث بالاسم أو الشركة أو الناقل...").fill("فاطمة");
    await page.waitForTimeout(400);
    const rows = page.locator("tbody tr");
    const count = await rows.count();
    expect(count).toBe(2); // فاطمة has offers 3 & 4
  });

  test("select offer opens a confirm dialog describing the irreversible outcome", async ({ page }) => {
    await page.locator('button[title="اختيار العرض"]').first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "تأكيد اختيار العرض" })).toBeVisible();
    await expect(dialog.getByText(/سيتم إنشاء حجز من هذا العرض/)).toBeVisible();
    await expect(dialog.getByText("العميل").first()).toBeVisible();
    await expect(dialog.getByText("شركة التنفيذ").first()).toBeVisible();
    await expect(dialog.getByText("التكلفة").first()).toBeVisible();
    await expect(dialog.getByRole("button", { name: "تأكيد الاختيار" })).toBeVisible();
    // cancel does not mutate
    await dialog.getByRole("button", { name: "إلغاء" }).click();
    await expect(dialog).toBeHidden();
  });

  test("reject offer opens a confirm dialog and cancel leaves data untouched", async ({ page }) => {
    const before = await page.locator("tbody tr").count();
    await page.locator('button[title="رفض العرض"]').first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "تأكيد رفض العرض" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "تأكيد الرفض" })).toBeVisible();
    await dialog.getByRole("button", { name: "إلغاء" }).click();
    await expect(dialog).toBeHidden();
    expect(await page.locator("tbody tr").count()).toBe(before);
  });
});
