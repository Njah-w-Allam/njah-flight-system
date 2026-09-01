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

  test("agency-style flight format is parsed into airline, cost and date", async ({ page }) => {
    await page.getByRole("button", { name: /لصق عرض بسرعة/ }).click();
    // Real agency response format (airline code + flight no, airport codes, bare price)
    await page.getByLabel("نص العرض (من واتساب / إيميل)").fill(
      "NE 170 V 30AUG CAIT1 JEDNT 0530 0745\n13240\n30+7\nSV 318 K 08SEP CAI 2 MED 0930 1125\n13950\n23+23+7"
    );
    await page.getByRole("button", { name: "تحليل وتعبئة" }).click();
    await expect(page.getByText("تم التعرف على البيانات").first()).toBeVisible();
    await expect(page.getByText("الناقل:", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("تكلفة التنفيذ:", { exact: false }).first()).toBeVisible();

    await page.getByRole("button", { name: "تعبئة النموذج بالبيانات المختارة" }).click();
    await expect(page.locator('input[type="number"]')).toHaveValue("13240");
    await expect(
      page.locator("[role=combobox]").filter({ hasText: /النيل/ }).first()
    ).toBeVisible();
    await expect(page.locator('input[type="datetime-local"]').first()).toHaveValue("2026-08-30T00:00");
  });

  test("a route matching an open request auto-selects that request (وجهة)", async ({ page }) => {
    await page.getByRole("button", { name: /لصق عرض بسرعة/ }).click();
    // CAI→DXB maps to القاهرة → دبي which is an open request.
    await page.getByLabel("نص العرض (من واتساب / إيميل)").fill(
      "SV 318 V 01SEP CAI DXB 0930 1125\n13950"
    );
    await page.getByRole("button", { name: "تحليل وتعبئة" }).click();
    // The review box announces the matched request and its وجهة.
    await expect(page.getByText("وجهة تُطابق الطلب:").first()).toBeVisible();

    await page.getByRole("button", { name: "تعبئة النموذج بالبيانات المختارة" }).click();
    // The request select (placeholder "اختر الطلب") is now filled with the matched
    // request — the placeholder is gone, proving the وجهة auto-selected a request.
    await expect(page.getByText("اختر الطلب")).toHaveCount(0);
  });

  test("parses Arabic-Indic digits and lowercase airline codes", async ({ page }) => {
    await page.getByRole("button", { name: /لصق عرض بسرعة/ }).click();
    await page.getByLabel("نص العرض (من واتساب / إيميل)").fill(
      "sv318 k 30aug cai jed 0520 0735\n١٣٩٥٠"
    );
    await page.getByRole("button", { name: "تحليل وتعبئة" }).click();
    await expect(page.getByText("تم التعرف على البيانات").first()).toBeVisible();
    await expect(page.getByText("تكلفة التنفيذ:", { exact: false }).first()).toBeVisible();

    await page.getByRole("button", { name: "تعبئة النموذج بالبيانات المختارة" }).click();
    // Arabic-Indic ١٣٩٥٠ → 13950, and lowercase flight "sv318" resolves to الخطوط السعودية.
    await expect(page.locator('input[type="number"]')).toHaveValue("13950");
    await expect(
      page.locator("[role=combobox]").filter({ hasText: /السعودية/ }).first()
    ).toBeVisible();
    await expect(page.locator('input[type="datetime-local"]').first()).toHaveValue("2026-08-30T00:00");
  });

  test("a pure Arabic-city route is recognized and auto-selects the matching request", async ({ page }) => {
    await page.getByRole("button", { name: /لصق عرض بسرعة/ }).click();
    await page.getByLabel("نص العرض (من واتساب / إيميل)").fill(
      "الخطوط السعودية اقتصادي\nالقاهرة إلى دبي\nالتكلفة 25,000 ج.م"
    );
    await page.getByRole("button", { name: "تحليل وتعبئة" }).click();
    // Faceة detected from Arabic cities and matched to the open القاهرة → دبي request.
    await expect(page.getByText("وجهة تُطابق الطلب:").first()).toBeVisible();
    await expect(page.getByText("تفاصيل الرحلة:", { exact: false }).first()).toBeVisible();
  });

  test("detects business class from Arabic 'أعمال' and European-style price", async ({ page }) => {
    await page.getByRole("button", { name: /لصق عرض بسرعة/ }).click();
    await page.getByLabel("نص العرض (من واتساب / إيميل)").fill(
      "طيران الإمارات كلاس رجال أعمال\nالقاهرة دبي\n13.240,00 ج.م"
    );
    await page.getByRole("button", { name: "تحليل وتعبئة" }).click();
    await expect(page.getByText("تم التعرف على البيانات").first()).toBeVisible();
    await expect(page.getByText("نوع العرض:", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("تكلفة التنفيذ:", { exact: false }).first()).toBeVisible();
  });
});
