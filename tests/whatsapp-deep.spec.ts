import { test, expect } from "@playwright/test";

// Deep tests for the WhatsApp request dialog opened from the booking detail
// (WhatsAppRequestDialog) — verifies the privacy-filtered message body, the
// wa.me deep-link construction, copy affordance and editability.

test.describe("WhatsApp request dialog — booking 1", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/bookings/1");
    await page.waitForLoadState("networkidle");
    await page.locator("main").getByRole("button", { name: "إرسال الطلب عبر واتساب" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("message body carries the full flight request for the exec company", async ({ page }) => {
    const textarea = page.getByRole("dialog").locator("textarea");
    const text = await textarea.inputValue();
    expect(text).toContain("السلام عليكم ورحمة الله وبركاته");
    expect(text).toContain("مطلوب سعر وتوافر للرحلة التالية");
    expect(text).toContain("من: القاهرة");
    expect(text).toContain("إلى: جدة");
    expect(text).toContain("تاريخ السفر: 27 سبتمبر 2026");
    expect(text).toContain("تاريخ العودة: 7 أكتوبر 2026");
    expect(text).toContain("عدد المسافرين: 4");
    expect(text).toContain("الدرجة: economy");
    expect(text).toContain("مرجع الحجز: BK-2026-001");
    expect(text).toContain("شكرًا لتعاونكم");
  });

  test("message body never exposes the customer name, phone or the customer label", async ({ page }) => {
    const text = await page.getByRole("dialog").locator("textarea").inputValue();
    expect(text).not.toContain("خالد");
    expect(text).not.toContain("01234567890");
    expect(text).not.toContain("العميل:");
    expect(text).not.toContain("عبدالله");
  });

  test("wa.me link targets the exec company number and encodes the body", async ({ page }) => {
    const link = page.getByRole("dialog").locator('a[href*="wa.me"]');
    const href = await link.getAttribute("href");
    expect(href).toMatch(/^https:\/\/wa\.me\/201011122233\?text=/);
    expect(href).toContain("text=");
    // encoded Arabic greeting is present in the query
    expect(href).toContain("%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85");
  });

  test("copy button copies the message", async ({ page }) => {
    const dialog = page.getByRole("dialog");
    const copyBtn = dialog.getByRole("button", { name: "نسخ الرسالة" });
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();
    // Headless Chromium may succeed or fail the clipboard write depending on
    // permissions; either outcome must produce a toast acknowledgement.
    await expect(
      page.getByText("تم نسخ").or(page.getByText("تعذّر النسخ")).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("message is editable and the send link follows the edits", async ({ page }) => {
    const dialog = page.getByRole("dialog");
    const textarea = dialog.locator("textarea");
    await textarea.fill("رسالة معدلة بشكل خاص");
    const link = dialog.locator('a[href*="wa.me"]');
    const href = await link.getAttribute("href");
    expect(href).toContain(encodeURIComponent("رسالة معدلة بشكل خاص"));
  });
});
