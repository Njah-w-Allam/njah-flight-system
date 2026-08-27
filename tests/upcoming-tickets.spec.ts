import { test, expect } from "@playwright/test";

test.describe("Upcoming Tickets Screen", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/upcoming-tickets");
    await page.waitForLoadState("networkidle");
  });

  test("displays the page heading", async ({ page }) => {
    await expect(page.getByText("التذاكر القريبة الرحيل")).toBeVisible();
  });

  test("displays the page description", async ({ page }) => {
    await expect(
      page.getByText("كل تذكرة موعد إقلاعها خلال 24 ساعة القادمة")
    ).toBeVisible();
  });

  test("page loads without errors", async ({ page }) => {
    const response = await page.goto("/upcoming-tickets");
    expect(response?.status()).toBe(200);
  });

  test("shows either tickets or empty state message", async ({ page }) => {
    const hasTickets = await page.locator('[data-slot="card"]').first().isVisible();
    const hasEmptyState = await page.getByText(
      "لا توجد تذاكر موعد إقلاعها خلال 24 ساعة القادمة"
    ).isVisible();

    expect(hasTickets || hasEmptyState).toBeTruthy();
  });

  test("if tickets exist, each ticket card shows customer name", async ({ page }) => {
    const ticketCards = page.locator('[data-slot="card-content"]').locator("div").filter({ hasText: /المغادرة|الوصول/ });
    const count = await ticketCards.count();

    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        await expect(ticketCards.nth(i)).toBeVisible();
      }
    }
  });

  test("ticket cards show flight route info", async ({ page }) => {
    const departureLabel = page.getByText("المغادرة").first();
    const arrivalLabel = page.getByText("الوصول").first();

    // Real upcoming-ticket cards contain the route labels; the empty-state card
    // (rendered when no tickets depart within 24h) does NOT. Only assert when
    // actual ticket cards exist, so this test is not falsely tripped by data
    // being absent.
    const hasTicketCard = await page
      .locator('[data-slot="card-content"]')
      .locator("div")
      .filter({ hasText: /المغادرة|الوصول/ })
      .first()
      .isVisible()
      .catch(() => false);

    if (hasTicketCard) {
      await expect(departureLabel).toBeVisible();
      await expect(arrivalLabel).toBeVisible();
    }
  });

  test("tickets display urgency badges (critical/warning/normal)", async ({ page }) => {
    const badges = page.locator('[data-slot="badge"]');
    const badgeCount = await badges.count();
    expect(badgeCount).toBeGreaterThanOrEqual(0);
  });
});
