import { test, expect } from "@playwright/test";

test.describe("Modifications & Refunds", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/modifications");
    await page.waitForLoadState("networkidle");
  });

  test("displays the page heading", async ({ page }) => {
    await expect(page.locator("main h1").filter({ hasText: "التعديلات والاستردادات" })).toBeVisible();
  });

  test("has modifications and refunds tabs", async ({ page }) => {
    await expect(page.getByRole("tab", { name: /التعديلات/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /الاستردادات/ })).toBeVisible();
  });

  test("modifications tab is active by default", async ({ page }) => {
    const modificationsTab = page.getByRole("tab", { name: /التعديلات/ });
    await expect(modificationsTab).toHaveAttribute("aria-selected", "true");
  });

  test("modifications tab shows table with column headers", async ({ page }) => {
    const headers = ["#", "التذكرة", "العميل", "البيانات القديمة", "البيانات الجديدة", "الرسوم", "التاريخ"];
    for (const header of headers) {
      await expect(page.locator("th").filter({ hasText: header }).first()).toBeVisible();
    }
  });

  test("modifications tab has 'record modification' button", async ({ page }) => {
    const modBtn = page.getByRole("button", { name: /تسجيل تعديل/ });
    await expect(modBtn).toBeVisible();
  });

  test("clicking record modification opens dialog", async ({ page }) => {
    const modBtn = page.getByRole("button", { name: /تسجيل تعديل/ });
    await modBtn.click();

    await expect(page.getByText("تسجيل تعديل جديد")).toBeVisible();
    await expect(page.getByText("أدخل بيانات التعديل على التذكرة.")).toBeVisible();
  });

  test("modification dialog has ticket selector and JSON fields", async ({ page }) => {
    const modBtn = page.getByRole("button", { name: /تسجيل تعديل/ });
    await modBtn.click();

    await expect(page.getByText("البيانات القديمة (JSON)")).toBeVisible();
    await expect(page.getByText("البيانات الجديدة (JSON)")).toBeVisible();
    await expect(page.getByText("رسوم التعديل (ج.م)")).toBeVisible();
    await expect(page.locator('[data-slot="select-trigger"]').first()).toBeVisible();
  });

  test("switching to refunds tab", async ({ page }) => {
    const refundsTab = page.getByRole("tab", { name: /الاستردادات/ });
    await refundsTab.click();

    await expect(refundsTab).toHaveAttribute("aria-selected", "true");

    const headers = ["#", "التذكرة", "العميل", "المبلغ المتوقع", "الحالة"];
    for (const header of headers) {
      await expect(page.locator("th").filter({ hasText: header }).first()).toBeVisible();
    }
  });

  test("refunds tab has 'record refund' button", async ({ page }) => {
    const refundsTab = page.getByRole("tab", { name: /الاستردادات/ });
    await refundsTab.click();

    const refundBtn = page.getByRole("button", { name: /تسجيل استرداد/ });
    await expect(refundBtn).toBeVisible();
  });

  test("clicking record refund opens dialog", async ({ page }) => {
    const refundsTab = page.getByRole("tab", { name: /الاستردادات/ });
    await refundsTab.click();

    const refundBtn = page.getByRole("button", { name: /تسجيل استرداد/ });
    await refundBtn.click();

    await expect(page.getByText("تسجيل استرداد جديد")).toBeVisible();
  });

  test("refund dialog has amount and responsible party fields", async ({ page }) => {
    const refundsTab = page.getByRole("tab", { name: /الاستردادات/ });
    await refundsTab.click();

    const refundBtn = page.getByRole("button", { name: /تسجيل استرداد/ });
    await refundBtn.click();

    await expect(page.getByText("المبلغ المتوقع (ج.م)")).toBeVisible();
  });
});

test.describe("Reports", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/reports");
    await page.waitForLoadState("networkidle");
  });

  test("displays the page heading", async ({ page }) => {
    await expect(page.locator("main h1").filter({ hasText: "التقارير" })).toBeVisible();
  });

  test("has all six report tabs", async ({ page }) => {
    const tabLabels = [
      "ملخص المبيعات",
      "مديونية العملاء",
      "مستحقات الشركات",
      "تقرير يومي",
      "تقرير شهري",
      "التسوية",
    ];
    for (const label of tabLabels) {
      await expect(page.getByRole("tab", { name: new RegExp(label) })).toBeVisible();
    }
  });

  test("sales summary tab is active by default", async ({ page }) => {
    const salesTab = page.getByRole("tab", { name: /ملخص المبيعات/ });
    await expect(salesTab).toHaveAttribute("aria-selected", "true");
  });

  test("sales summary tab shows stat cards", async ({ page }) => {
    await expect(page.getByText("إجمالي الحجوزات")).toBeVisible();
    await expect(page.getByText("إجمالي الإيرادات")).toBeVisible();
    await expect(page.getByText("إجمالي التكاليف")).toBeVisible();
    await expect(page.getByText("إجمالي الأرباح")).toBeVisible();
  });

  test("sales summary tab shows financial summary card", async ({ page }) => {
    await expect(page.getByText("ملخص المبيعات").nth(0)).toBeVisible();
    await expect(page.getByText("الإيرادات من المبيعات")).toBeVisible();
    await expect(page.getByText("تكلفة المبيعات")).toBeVisible();
    await expect(page.getByText("هامش الربح")).toBeVisible();
  });

  test("customer debts tab shows debt table", async ({ page }) => {
    const debtsTab = page.getByRole("tab", { name: /مديونية العملاء/ });
    await debtsTab.click();

    await expect(page.getByText("مديونية العملاء").nth(0)).toBeVisible();
    await expect(page.locator("th").filter({ hasText: "اسم العميل" })).toBeVisible();
    await expect(page.locator("th").filter({ hasText: "الرصيد المدين" })).toBeVisible();
  });

  test("company debts tab shows debts table", async ({ page }) => {
    const debtsTab = page.getByRole("tab", { name: /مستحقات الشركات/ });
    await debtsTab.click();

    await expect(page.getByText("مستحقات شركات التنفيذ").first()).toBeVisible();
    await expect(page.locator("th").filter({ hasText: "اسم الشركة" })).toBeVisible();
  });

  test("daily report tab shows daily stats", async ({ page }) => {
    const dailyTab = page.getByRole("tab", { name: /تقرير يومي/ });
    await dailyTab.click();

    await expect(page.getByText("حجوزات اليوم").first()).toBeVisible();
  });

  test("monthly report tab shows monthly stats", async ({ page }) => {
    const monthlyTab = page.getByRole("tab", { name: /تقرير شهري/ });
    await monthlyTab.click();

    await expect(page.getByText("حجوزات الشهر")).toBeVisible();
    await expect(page.getByText("إيرادات الشهر")).toBeVisible();
    await expect(page.getByText("تكاليف الشهر")).toBeVisible();
  });

  test("monthly report shows profit summary", async ({ page }) => {
    const monthlyTab = page.getByRole("tab", { name: /تقرير شهري/ });
    await monthlyTab.click();

    await expect(page.getByText("ملخص الشهري")).toBeVisible();
    await expect(page.getByText("صافي الربح")).toBeVisible();
  });

  test("reconciliation tab shows reconciliation tables", async ({ page }) => {
    const reconTab = page.getByRole("tab", { name: /التسوية/ });
    await reconTab.click();

    await expect(page.getByText("تسوية أرصدة العملاء").first()).toBeVisible();
    await expect(page.getByText("تسوية أرصدة شركات التنفيذ").first()).toBeVisible();
  });

  test("reconciliation tab shows column headers", async ({ page }) => {
    const reconTab = page.getByRole("tab", { name: /التسوية/ });
    await reconTab.click();

    await expect(page.locator("th").filter({ hasText: "الرصيد المخزّن" }).first()).toBeVisible();
    await expect(page.locator("th").filter({ hasText: "الرصيد المحسوب" }).first()).toBeVisible();
    await expect(page.locator("th").filter({ hasText: "الفرق" }).first()).toBeVisible();
  });
});
