import { test, expect } from "@playwright/test";

// Deep data-aware tests for the booking detail screen, asserted against the
// stable dev-DB reference bookings (BK-2026-001 = id 1, BK-2026-003 = id 3).
// All assertions are scoped to <main> to avoid the global-search header text.

test.describe("Booking Detail — Reference Booking 1 (BK-2026-001)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/bookings/1");
    await page.waitForLoadState("networkidle");
  });

  test("financial bar shows selling, paid and remaining derived values", async ({ page }) => {
    const bar = page.locator("main").first();
    await expect(bar.getByText("35,000.00 ج.م").first()).toBeVisible();
    await expect(bar.getByText("15,000.00 ج.م").first()).toBeVisible();
    await expect(bar.getByText("20,000.00 ج.م").first()).toBeVisible();
    await expect(bar.getByText("سعر البيع").first()).toBeVisible();
    await expect(bar.getByText("المدفوع").first()).toBeVisible();
    await expect(bar.getByText("المتبقي").first()).toBeVisible();
  });

  test("selling-price edit pencil button is present", async ({ page }) => {
    await expect(page.locator('button[title="تحديد سعر البيع"]')).toBeVisible();
  });

  test("next-action card for a WAITING_TICKETING booking demands ticket issuance", async ({ page }) => {
    const main = page.locator("main");
    await expect(main.getByText("الإجراء التالي").first()).toBeVisible();
    await expect(main.getByText("مطلوب الآن: إصدار التذكرة").first()).toBeVisible();
    await expect(main.getByText("هناك تذاكر قيد الانتظار.").first()).toBeVisible();
    await expect(main.getByRole("button", { name: "إصدار التذكرة" }).first()).toBeVisible();
  });

  test("execution company block shows name, phone, call and WhatsApp actions", async ({ page }) => {
    const main = page.locator("main");
    await expect(main.getByText("شركة التنفيذ").first()).toBeVisible();
    await expect(main.getByText("شركة الرحلات السياحية").first()).toBeVisible();
    await expect(main.getByText("01011122233").first()).toBeVisible();
    await expect(main.getByRole("button", { name: "اتصال" })).toBeVisible();
    await expect(main.getByRole("button", { name: "إرسال الطلب عبر واتساب" })).toBeVisible();
    const tel = main.locator('a[href="tel:01011122233"]');
    await expect(tel).toBeVisible();
  });

  test("route visual renders both round-trip segments with airline and flight number", async ({ page }) => {
    const main = page.locator("main");
    await expect(main.getByText("القاهرة").first()).toBeVisible();
    await expect(main.getByText("جدة").first()).toBeVisible();
    await expect(main.getByText("SV306").first()).toBeVisible();
    await expect(main.getByText("SV305").first()).toBeVisible();
    await expect(main.getByText("الخطوط السعودية").first()).toBeVisible();
  });

  test("lifecycle stepper shows completed request/offers/booking and active payment step", async ({ page }) => {
    const stepper = page.locator('ol[aria-label="دورة الحجز"]');
    await expect(stepper).toBeVisible();
    const labels = ["الطلب", "العروض", "الحجز", "الدفع", "الإصدار", "السفر"];
    for (const l of labels) {
      await expect(stepper.getByText(l, { exact: true })).toBeVisible();
    }
    // WAITING_TICKETING -> payment (index 3) is the active step with the number 4
    await expect(stepper.getByText("4", { exact: true })).toBeVisible();
    // Three leading steps are marked done with a check mark
    await expect(stepper.getByText("✓", { exact: true })).toHaveCount(3);
  });

  test("tabs expose all six sections with correct counts", async ({ page }) => {
    await expect(page.getByRole("tab", { name: /نظرة عامة/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /التذاكر \(2\)/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /المسافرين \(4\)/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /المدفوعات/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /تاريخ الأسعار/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /التنبيهات \(2\)/ })).toBeVisible();
  });

  test("overview tab shows booking reference and financials", async ({ page }) => {
    const main = page.locator("main");
    await expect(main.getByText("بيانات الحجز").first()).toBeVisible();
    await expect(main.getByText("BK-2026-001").first()).toBeVisible();
    await expect(main.getByText("البيانات المالية").first()).toBeVisible();
    await expect(main.getByText("28,000.00 ج.م").first()).toBeVisible();
    await expect(main.getByText("35,000.00 ج.م").first()).toBeVisible();
    await expect(main.getByText("7,000.00 ج.م").first()).toBeVisible();
  });
});

test.describe("Booking Detail — Tickets/Payments/Price tabs (booking 1)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/bookings/1");
    await page.waitForLoadState("networkidle");
  });

  test("tickets tab lists the two pending tickets with PNR ABC123", async ({ page }) => {
    await page.getByRole("tab", { name: /التذاكر/ }).click();
    const main = page.locator("main");
    await expect(main.getByText("ABC123").first()).toBeVisible();
    // two pending tickets each rendered with the pending badge label
    await expect(main.getByText("قيد الانتظار").first()).toBeVisible();
    // issue + cancel controls appear for pending tickets
    await expect(page.locator('button[title="إصدار التذكرة"]').first()).toBeVisible();
    await expect(page.locator('button[title="إلغاء التذكرة"]').first()).toBeVisible();
  });

  test("payments tab shows customer and execution payment tables with amounts and notes", async ({ page }) => {
    await page.getByRole("tab", { name: /المدفوعات/ }).click();
    const main = page.locator("main");
    await expect(main.getByText("مدفوعات العميل (2)").first()).toBeVisible();
    await expect(main.getByText("10,000.00 ج.م").first()).toBeVisible();
    await expect(main.getByText("5,000.00 ج.م").first()).toBeVisible();
    await expect(main.getByText("دفعة أولى").first()).toBeVisible();
    await expect(main.getByText("دفعة ثانية").first()).toBeVisible();
    // booking-detail payments table renders the raw method (cash / instapay)
    await expect(main.getByText("cash").first()).toBeVisible();
    await expect(main.getByText("instapay").first()).toBeVisible();
    await expect(main.getByText("مدفوعات شركة التنفيذ (1)").first()).toBeVisible();
    await expect(main.getByText("14,000.00 ج.م").first()).toBeVisible();
    await expect(main.getByText("دفع نصف المبلغ").first()).toBeVisible();
  });

  test("price-history tab shows the seeded price change row", async ({ page }) => {
    await page.getByRole("tab", { name: /تاريخ الأسعار/ }).click();
    const main = page.locator("main");
    await expect(main.getByText("7,000.00 ج.م").first()).toBeVisible();
    await expect(main.getByText("سعر البيع الأولي").first()).toBeVisible();
  });
});

test.describe("Booking Detail — Reference Booking 3 (BK-2026-003, COMPLETED)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/bookings/3");
    await page.waitForLoadState("networkidle");
  });

  test("shows completed status, issued-before-payment badge and completed next action", async ({ page }) => {
    const main = page.locator("main");
    await expect(main.getByText("مكتمل").first()).toBeVisible();
    await expect(main.getByText("إصدار قبل الدفع").first()).toBeVisible();
    await expect(main.getByText("اكتمل السفر").first()).toBeVisible();
    await expect(main.getByRole("button", { name: "فتح الحجز" }).first()).toBeVisible();
  });

  test("risk banner surfaces because of issued-before-payment + risk reason", async ({ page }) => {
    const main = page.locator("main");
    await expect(main.getByText("هذا الحجز يحتاج متابعة:  عميل ثقة.").first()).toBeVisible();
    await expect(main.getByText("ملاحظة مخاطرة").first()).toBeVisible();
    await expect(main.getByText("المالك").first()).toBeVisible();
    await expect(main.getByText("عميل ثقة").first()).toBeVisible();
  });

  test("completed booking stepper marks all steps through issuance as done", async ({ page }) => {
    const stepper = page.locator('ol[aria-label="دورة الحجز"]');
    await expect(stepper).toBeVisible();
    // COMPLETED -> travel index 5 active; issuance and earlier steps done
    await expect(stepper.getByText("✓", { exact: true })).toHaveCount(5);
    await expect(stepper.getByText("6", { exact: true })).toBeVisible();
  });

  test("financial overview matches the completed booking values", async ({ page }) => {
    const main = page.locator("main");
    await expect(main.getByText("55,000.00 ج.م").first()).toBeVisible();
    await expect(main.getByText("20,000.00 ج.م").first()).toBeVisible();
    await expect(main.getByText("35,000.00 ج.م").first()).toBeVisible();
    await expect(main.getByText("10,000.00 ج.م").first()).toBeVisible();
  });
});

test.describe("Booking Detail — Quick actions dialogs", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/bookings/1");
    await page.waitForLoadState("networkidle");
  });

  test("تسجيل دفعة opens the payment quick dialog with customer context", async ({ page }) => {
    await page.locator("main").getByRole("button", { name: "تسجيل دفعة" }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("تسجيل دفعة").first()).toBeVisible();
    await expect(dialog.getByText(/خالد عبدالله سعيد — حجز #1/)).toBeVisible();
    await expect(dialog.getByRole("button", { name: "تسجيل الدفعة" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "إلغاء" })).toBeVisible();
    await dialog.getByRole("button", { name: "إلغاء" }).click();
    await expect(dialog).toBeHidden();
  });

  test("تسجيل تذكرة opens the ticket quick dialog for this booking", async ({ page }) => {
    await page.locator("main").getByRole("button", { name: "تسجيل تذكرة" }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("حجز #1").first()).toBeVisible();
    await expect(dialog.getByText("رقم التذكرة")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "تسجيل التذكرة" })).toBeVisible();
    // The booking has 4 passengers, so the passenger selector is shown
    await expect(dialog.getByText("المسافرين").first()).toBeVisible();
    await dialog.getByRole("button", { name: "إلغاء" }).click();
    await expect(dialog).toBeHidden();
  });

  test("إضافة عرض opens the offer quick dialog", async ({ page }) => {
    await page.locator("main").getByRole("button", { name: "إضافة عرض" }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("إضافة عرض تنفيذ").first()).toBeVisible();
    await expect(dialog.getByRole("button", { name: "إضافة العرض" })).toBeVisible();
    await dialog.getByRole("button", { name: "إلغاء" }).click();
    await expect(dialog).toBeHidden();
  });
});
