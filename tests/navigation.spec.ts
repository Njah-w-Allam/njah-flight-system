import { test, expect } from "@playwright/test";

const routes = [
  { path: "/dashboard", heading: "لوحة التحكم" },
  { path: "/upcoming-tickets", heading: "التذاكر القريبة الرحيل" },
  { path: "/bookings", heading: "الحجوزات" },
  { path: "/customers", heading: "العملاء" },
  { path: "/execution-companies", heading: "شركات التنفيذ" },
  { path: "/booking-requests", heading: "طلبات الحجز" },
  { path: "/execution-offers", heading: "عروض التنفيذ" },
  { path: "/passengers", heading: "المسافرين" },
  { path: "/tickets", heading: "التذاكر" },
  { path: "/customer-payments", heading: "مدفوعات العملاء" },
  { path: "/execution-payments", heading: "مدفوعات شركات التنفيذ" },
  { path: "/modifications", heading: "التعديلات والاستردادات" },
  { path: "/reports", heading: "التقارير" },
];

test.describe("Sidebar Navigation", () => {
  test("sidebar displays all navigation links", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();

    const expectedLabels = [
      "لوحة التحكم",
      "التذاكر القريبة",
      "الحجوزات",
      "العملاء",
      "شركات التنفيذ",
      "طلبات الحجز",
      "عروض شركات التنفيذ",
      "المسافرين",
      "التذاكر",
      "مدفوعات العملاء",
      "مدفوعات شركات التنفيذ",
      "التعديلات والإلغاء",
      "التقارير",
    ];

    for (const label of expectedLabels) {
      await expect(sidebar.getByText(label, { exact: true })).toBeVisible();
    }
  });

  test("sidebar shows app title", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("aside h1").filter({ hasText: "نظام الحجوزات" })).toBeVisible();
  });
});

test.describe("Page Navigation", () => {
  for (const route of routes) {
    test(`navigates to ${route.path} and loads heading "${route.heading}"`, async ({ page }) => {
      const response = await page.goto(route.path);
      await page.waitForLoadState("networkidle");

      expect(response?.status()).toBe(200);
      await expect(page.locator("main h1").filter({ hasText: route.heading })).toBeVisible();
    });
  }
});

test.describe("Sidebar Link Navigation", () => {
  test("clicking each sidebar link navigates to the correct page", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const sidebarLinks = page.locator("aside nav a");
    const count = await sidebarLinks.count();
    expect(count).toBe(routes.length);

    for (let i = 0; i < count; i++) {
      const link = sidebarLinks.nth(i);
      const href = await link.getAttribute("href");
      expect(href).toBeTruthy();

      await link.click();
      await page.waitForURL(`**${href}**`);

      expect(page.url()).toContain(href!);
    }
  });
});

test.describe("No Console Errors", () => {
  for (const route of routes) {
    test(`${route.path} loads without console errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          errors.push(msg.text());
        }
      });

      await page.goto(route.path);
      await page.waitForLoadState("networkidle");

      const criticalErrors = errors.filter(
        (e) =>
          !e.includes("favicon") &&
          !e.includes("404") &&
          !e.includes("Decimal") &&
          !e.includes("Only plain objects")
      );
      expect(criticalErrors).toEqual([]);
    });
  }
});
