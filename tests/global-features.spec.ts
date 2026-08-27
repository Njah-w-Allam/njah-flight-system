import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Use dev-DB booking BK-2026-002 (id=2) which currently has selling_price = 0.
const BOOKING_ID = BigInt(2);
const BOOKING_REF = "BK-2026-002";

test.describe("Global Search", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
  });

  test("searching by booking reference navigates to the booking detail", async ({ page }) => {
    const searchTrigger = page.getByRole("combobox", { name: "بحث عالمي" });
    await searchTrigger.click();
    const input = page.getByPlaceholder("أدخل رقم الهاتف أو مرجع الحجز...");
    await input.fill(BOOKING_REF);
    await page.waitForTimeout(600);
    await expect(page.locator("[cmdk-item]").filter({ hasText: BOOKING_REF }).first()).toBeVisible();
    await page.locator("[cmdk-item]").filter({ hasText: BOOKING_REF }).first().click();
    await page.waitForURL(`**/bookings/${Number(BOOKING_ID)}**`);
    await expect(page.locator("main").getByText(BOOKING_REF).first()).toBeVisible();
  });

  test("searching by a phone that matches a booking's customer surfaces that booking", async ({ page }) => {
    const searchTrigger = page.getByRole("combobox", { name: "بحث عالمي" });
    await searchTrigger.click();
    await page.getByPlaceholder("أدخل رقم الهاتف أو مرجع الحجز...").fill("01234567890");
    await page.waitForTimeout(600);
    // 01234567890 belongs to خالد whose booking BK-2026-001 exists
    await expect
      .poll(async () => {
        const count = await page.locator("[cmdk-item]").count();
        return count;
      })
      .toBeGreaterThan(0);
  });

  test("empty query shows no results without errors", async ({ page }) => {
    const searchTrigger = page.getByRole("combobox", { name: "بحث عالمي" });
    await searchTrigger.click();
    await page.getByPlaceholder("أدخل رقم الهاتف أو مرجع الحجز...").fill("zzz-no-match-zzz");
    await page.waitForTimeout(600);
    await expect(page.getByText("لا توجد نتائج")).toBeVisible();
  });
});

test.describe("Selling Price", () => {
  let originalSelling: number;
  let originalProfit: number;

  test.beforeAll(async () => {
    const b = await prisma.bookings.findUnique({ where: { id: BOOKING_ID } });
    originalSelling = Number(b!.current_selling_price);
    originalProfit = Number(b!.current_profit);
  });

  test.afterAll(async () => {
    // Restore the original stored values so the dev DB isn't left dirty.
    await prisma.bookings.update({
      where: { id: BOOKING_ID },
      data: { current_selling_price: originalSelling, current_profit: originalProfit },
    });
    // Also remove any price_history rows created by this test to leave no trace.
    const rows = await prisma.price_history.findMany({
      where: { booking_id: BOOKING_ID },
      orderBy: { changed_at: "desc" },
    });
    for (const r of rows) {
      // Only delete rows we created (a fresh identical selling price + the test reason).
      if (Number(r.selling_price) === 42000 || r.reason === "E2E test price") {
        await prisma.price_history.delete({ where: { id: r.id } });
      }
    }
    await prisma.$disconnect();
  });

  test("a sold booking shows 'لم يُحدَّد بعد' before price is set", async ({ page }) => {
    // Booking 2 has selling_price 0 -> should be labelled as unset
    await page.goto(`/bookings/${Number(BOOKING_ID)}`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("main").getByText("لم يُحدَّد بعد").first()).toBeVisible();
  });

  test("setting a selling price persists and updates the displayed balance", async ({ page }) => {
    await page.goto(`/bookings/${Number(BOOKING_ID)}`);
    await page.waitForLoadState("networkidle");

    // Open the selling-price editor via the pencil button (title="تحديد سعر البيع")
    const pencil = page.locator('button[title="تحديد سعر البيع"]');
    await expect(pencil).toBeVisible();
    await pencil.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "تحديد سعر البيع" })).toBeVisible();

    const amount = dialog.getByPlaceholder("0.00");
    await amount.fill("42000");
    await dialog.getByRole("button", { name: "حفظ سعر البيع" }).click();

    // The dialog closes and the new price shows on the detail page
    await expect(page.getByRole("heading", { name: "تحديد سعر البيع" })).toBeHidden();
    await expect(page.locator("main").getByText("42,000").first()).toBeVisible();
    await expect(page.locator("main").getByText("لم يُحدَّد بعد").first()).toBeHidden();

    // The value is persisted in the DB with a price_history entry
    await expect
      .poll(async () => {
        const b = await prisma.bookings.findUnique({ where: { id: BOOKING_ID } });
        return Number(b!.current_selling_price);
      })
      .toBe(42000);

    const history = await prisma.price_history.findMany({
      where: { booking_id: BOOKING_ID, selling_price: 42000 },
    });
    expect(history.length).toBeGreaterThan(0);
  });
});
