import { test, expect } from "@playwright/test";

// Deep test for the "fast offer paste" panel on the execution-offer creation
// page. Uses the offline local parser (no OFFER_EXTRACTION_API_KEY configured),
// so it exercises the parse -> review -> fill flow end to end.

test.describe("Fast offer paste panel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/execution-offers/new");
    await page.waitForLoadState("networkidle");
  });

  test("pasting an offer text analyzes it and fills the form fields", async ({ page }) => {
    await page.getByRole("button", { name: /لصق عرض بسرعة/ }).click();
    await page.getByLabel("نص العرض (من واتساب / إيميل)").fill(
      "الخطوط السعودية (SV) اقتصادي\nالقاهرة → جدة\nالتكلفة 28,000 ج.م\nموعد الإصدار 27/09/2026 20:00"
    );
    await page.getByRole("button", { name: "تحليل وتعبئة" }).click();

    // Review cards appear for the recognized data
    await expect(page.getByText("تم التعرف على البيانات").first()).toBeVisible();
    await expect(page.getByText("الناقل:", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("نوع العرض:", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("تكلفة التنفيذ:", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("تفاصيل الرحلة:", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("موعد الإصدار:", { exact: false }).first()).toBeVisible();

    // Apply the parsed values into the main form
    await page.getByRole("button", { name: "تعبئة النموذج بالبيانات المختارة" }).click();

    // Cost input got filled from the parsed amount.
    await expect(page.locator('input[type="number"]')).toHaveValue("28000");
    // Airline select reflects the matched carrier.
    await expect(
      page.locator("[role=combobox]").filter({ hasText: /الخطوط السعودية/ }).first()
    ).toBeVisible();
    // Ticketing deadline (first datetime-local input) got filled.
    await expect(page.locator('input[type="datetime-local"]').first()).toHaveValue("2026-09-27T20:00");
  });

  test("filling warns when no recognizable data is found", async ({ page }) => {
    await page.getByRole("button", { name: /لصق عرض بسرعة/ }).click();
    await page.getByLabel("نص العرض (من واتساب / إيميل)").fill("سلام يا معلم");
    await page.getByRole("button", { name: "تحليل وتعبئة" }).click();
    await expect(page.getByText("لم يتم التعرف على أية بيانات قابلة للتعبئة")).toBeVisible();
  });

  test("analyze requires text or image first", async ({ page }) => {
    await page.getByRole("button", { name: /لصق عرض بسرعة/ }).click();
    await page.getByRole("button", { name: "تحليل وتعبئة" }).click();
    await expect(page.getByText("الصق نص العرض أو ارفق صورة أولاً")).toBeVisible();
  });
});
