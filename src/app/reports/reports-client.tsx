"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EGPAmount, PaymentStatusBadge } from "@/components/status-badges";
import { StatCard } from "@/components/stat-card";
import {
  BarChart3,
  Users,
  Building2,
  CalendarDays,
  CalendarRange,
  Scale,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";
import { payment_method_enum, payment_status_enum, booking_status_enum } from "@prisma/client";

interface Summary {
  totalBookings: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
}

interface CustomerDebt {
  id: bigint;
  name: string;
  phone: string;
  balance: number;
  currency: string;
}

interface CompanyDebt {
  id: bigint;
  name: string;
  balance: number;
  currency: string;
}

interface DailyBooking {
  id: bigint;
  customerName: string;
  sellingPrice: number;
  currency: string;
  status: booking_status_enum;
  createdAt: string;
}

interface DailyPayment {
  id: bigint;
  customerName: string;
  amount: number;
  currency: string;
  method: payment_method_enum;
  status: payment_status_enum;
  date: string;
}

interface DailyExecPayment {
  id: bigint;
  companyName: string;
  amount: number;
  currency: string;
  status: payment_status_enum;
  date: string;
}

interface MonthlySummary {
  bookingsCount: number;
  revenue: number;
  cost: number;
  profit: number;
  paymentsCollected: number;
  paymentsSent: number;
}

interface ReconciliationRow {
  id: bigint;
  name: string;
  storedBalance: number;
  calculatedBalance: number;
  discrepancy: number;
}

interface ExecReconciliationRow {
  id: bigint;
  name: string;
  storedBalance: number;
  calculatedBalance: number;
  totalOwed: number;
  totalPaid: number;
  discrepancy: number;
}

const paymentMethodLabels: Record<payment_method_enum, string> = {
  cash: "نقدي",
  instapay: "إنستاباي",
  vodafone_cash: "فودافون كاش",
};

const bookingStatusLabels: Record<booking_status_enum, string> = {
  NEW: "جديد",
  WAITING_PAYMENT: "بانتظار الدفع",
  WAITING_TICKETING: "بانتظار الإصدار",
  TICKETED: "تم الإصدار",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغي",
  PARTIALLY_CANCELLED: "إلغاء جزئي",
  MODIFIED: "تم التعديل",
  AT_RISK: "تحت المخاطرة",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ar-EG-u-nu-latn", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ReportsClient({
  summary,
  customerDebts,
  companyDebts,
  daily,
  monthly,
  reconciliation,
  execReconciliation,
}: {
  summary: Summary;
  customerDebts: CustomerDebt[];
  companyDebts: CompanyDebt[];
  daily: {
    bookings: DailyBooking[];
    payments: DailyPayment[];
    execPayments: DailyExecPayment[];
  };
  monthly: MonthlySummary;
  reconciliation: ReconciliationRow[];
  execReconciliation: ExecReconciliationRow[];
}) {
  const [activeTab, setActiveTab] = useState("sales");

  const hasCustomerDiscrepancies = reconciliation.some(
    (r) => Math.abs(r.discrepancy) > 0.01
  );
  const hasExecDiscrepancies = execReconciliation.some(
    (r) => Math.abs(r.discrepancy) > 0.01
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">التقارير</h1>
      </div>

      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
          <TabsTrigger value="sales" className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" />
            ملخص المبيعات
          </TabsTrigger>
          <TabsTrigger value="customer-debts" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            مديونية العملاء
          </TabsTrigger>
          <TabsTrigger value="company-debts" className="flex items-center gap-1">
            <Building2 className="h-4 w-4" />
            مستحقات الشركات
          </TabsTrigger>
          <TabsTrigger value="daily" className="flex items-center gap-1">
            <CalendarDays className="h-4 w-4" />
            تقرير يومي
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex items-center gap-1">
            <CalendarRange className="h-4 w-4" />
            تقرير شهري
          </TabsTrigger>
          <TabsTrigger value="reconciliation" className="flex items-center gap-1">
            <Scale className="h-4 w-4" />
            التسوية
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <StatCard
              title="إجمالي الحجوزات"
              value={summary.totalBookings}
              icon={BarChart3}
            />
            <StatCard
              title="إجمالي الإيرادات"
              value={<EGPAmount amount={summary.totalRevenue} />}
              icon={TrendingUp}
              variant="default"
            />
            <StatCard
              title="إجمالي التكاليف"
              value={<EGPAmount amount={summary.totalCost} />}
              icon={TrendingDown}
            />
            <StatCard
              title="إجمالي الأرباح"
              value={<EGPAmount amount={summary.totalProfit} />}
              icon={BarChart3}
              variant={summary.totalProfit >= 0 ? "default" : "destructive"}
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ملخص المبيعات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">الإيرادات من المبيعات</div>
                  <div className="text-xl font-bold mt-1">
                    <EGPAmount amount={summary.totalRevenue} />
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">تكلفة المبيعات</div>
                  <div className="text-xl font-bold mt-1">
                    <EGPAmount amount={summary.totalCost} />
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">هامش الربح</div>
                  <div className="text-xl font-bold mt-1">
                    {summary.totalRevenue > 0
                      ? `${((summary.totalProfit / summary.totalRevenue) * 100).toFixed(1)}%`
                      : "0%"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customer-debts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">مديونية العملاء</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">#</TableHead>
                      <TableHead className="text-right">اسم العميل</TableHead>
                      <TableHead className="text-right">الهاتف</TableHead>
                      <TableHead className="text-right">الرصيد المدين</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerDebts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          لا توجد أرصدة مدينة للعملاء
                        </TableCell>
                      </TableRow>
                    ) : (
                      customerDebts.map((c, i) => (
                        <TableRow key={String(c.id)}>
                          <TableCell className="font-medium">{i + 1}</TableCell>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell dir="ltr" className="text-left">{c.phone}</TableCell>
                          <TableCell>
                            <span className="text-green-600">
                              <EGPAmount amount={c.balance} />
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company-debts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">مستحقات شركات التنفيذ</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">#</TableHead>
                      <TableHead className="text-right">اسم الشركة</TableHead>
                      <TableHead className="text-right">الرصيد المستحق</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companyDebts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          لا توجد مستحقات لشركات التنفيذ
                        </TableCell>
                      </TableRow>
                    ) : (
                      companyDebts.map((c, i) => (
                        <TableRow key={String(c.id)}>
                          <TableCell className="font-medium">{i + 1}</TableCell>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell>
                            <span className="text-green-600">
                              <EGPAmount amount={c.balance} />
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <StatCard
              title="حجوزات اليوم"
              value={daily.bookings.length}
              icon={CalendarDays}
            />
            <StatCard
              title="مدفوعات العملاء اليوم"
              value={<EGPAmount amount={daily.payments.reduce((s, p) => s + p.amount, 0)} />}
              icon={TrendingUp}
            />
            <StatCard
              title="مدفوعات شركات التنفيذ اليوم"
              value={<EGPAmount amount={daily.execPayments.reduce((s, p) => s + p.amount, 0)} />}
              icon={TrendingDown}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">حجوزات اليوم</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">#</TableHead>
                      <TableHead className="text-right">العميل</TableHead>
                      <TableHead className="text-right">سعر البيع</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {daily.bookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          لا توجد حجوزات اليوم
                        </TableCell>
                      </TableRow>
                    ) : (
                      daily.bookings.map((b) => (
                        <TableRow key={String(b.id)}>
                          <TableCell className="font-medium">{String(b.id)}</TableCell>
                          <TableCell>{b.customerName}</TableCell>
                          <TableCell><EGPAmount amount={b.sellingPrice} /></TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {bookingStatusLabels[b.status]}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">مدفوعات العملاء اليوم</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">#</TableHead>
                      <TableHead className="text-right">العميل</TableHead>
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead className="text-right">طريقة الدفع</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {daily.payments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          لا توجد مدفوعات اليوم
                        </TableCell>
                      </TableRow>
                    ) : (
                      daily.payments.map((p) => (
                        <TableRow key={String(p.id)}>
                          <TableCell className="font-medium">{String(p.id)}</TableCell>
                          <TableCell>{p.customerName}</TableCell>
                          <TableCell><EGPAmount amount={p.amount} /></TableCell>
                          <TableCell>{paymentMethodLabels[p.method]}</TableCell>
                          <TableCell><PaymentStatusBadge status={p.status} /></TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">مدفوعات شركات التنفيذ اليوم</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">#</TableHead>
                      <TableHead className="text-right">الشركة</TableHead>
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {daily.execPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          لا توجد مدفوعات شركات تنفيذ اليوم
                        </TableCell>
                      </TableRow>
                    ) : (
                      daily.execPayments.map((p) => (
                        <TableRow key={String(p.id)}>
                          <TableCell className="font-medium">{String(p.id)}</TableCell>
                          <TableCell>{p.companyName}</TableCell>
                          <TableCell><EGPAmount amount={p.amount} /></TableCell>
                          <TableCell><PaymentStatusBadge status={p.status} /></TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
            <StatCard
              title="حجوزات الشهر"
              value={monthly.bookingsCount}
              icon={CalendarRange}
            />
            <StatCard
              title="إيرادات الشهر"
              value={<EGPAmount amount={monthly.revenue} />}
              icon={TrendingUp}
            />
            <StatCard
              title="تكاليف الشهر"
              value={<EGPAmount amount={monthly.cost} />}
              icon={TrendingDown}
            />
            <StatCard
              title="أرباح الشهر"
              value={<EGPAmount amount={monthly.profit} />}
              icon={BarChart3}
              variant={monthly.profit >= 0 ? "default" : "destructive"}
            />
            <StatCard
              title="مدفوعات العملاء (الشهر)"
              value={<EGPAmount amount={monthly.paymentsCollected} />}
              icon={TrendingUp}
            />
            <StatCard
              title="مدفوعات شركات التنفيذ (الشهر)"
              value={<EGPAmount amount={monthly.paymentsSent} />}
              icon={TrendingDown}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ملخص الشهري</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="text-sm text-muted-foreground">الدخل مقابل المصروفات</div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">الإيرادات:</span>
                    <span className="font-bold text-green-600">
                      <EGPAmount amount={monthly.revenue} />
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">التكاليف:</span>
                    <span className="font-bold text-destructive">
                      <EGPAmount amount={monthly.cost} />
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-sm font-medium">صافي الربح:</span>
                    <span className={`font-bold ${monthly.profit >= 0 ? "text-green-600" : "text-destructive"}`}>
                      <EGPAmount amount={monthly.profit} />
                    </span>
                  </div>
                </div>
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="text-sm text-muted-foreground">تدفق النقد</div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">مدفوعات العملاء:</span>
                    <span className="font-bold text-green-600">
                      <EGPAmount amount={monthly.paymentsCollected} />
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">مدفوعات التنفيذ:</span>
                    <span className="font-bold text-destructive">
                      <EGPAmount amount={monthly.paymentsSent} />
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-sm font-medium">صافي التدفق:</span>
                    <span className={`font-bold ${
                      monthly.paymentsCollected - monthly.paymentsSent >= 0
                        ? "text-green-600"
                        : "text-destructive"
                    }`}>
                      <EGPAmount amount={monthly.paymentsCollected - monthly.paymentsSent} />
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reconciliation" className="space-y-4">
          {(hasCustomerDiscrepancies || hasExecDiscrepancies) && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-200">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">
                تم اكتشاف فروقات في الأرصدة. يرجى مراجعة البيانات أدناه.
              </span>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">تسوية أرصدة العملاء</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">#</TableHead>
                      <TableHead className="text-right">اسم العميل</TableHead>
                      <TableHead className="text-right">الرصيد المخزّن</TableHead>
                      <TableHead className="text-right">الرصيد المحسوب</TableHead>
                      <TableHead className="text-right">الفرق</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reconciliation.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          لا يوجد عملاء مسجلون
                        </TableCell>
                      </TableRow>
                    ) : (
                      reconciliation.map((r) => (
                        <TableRow key={String(r.id)}>
                          <TableCell className="font-medium">{String(r.id)}</TableCell>
                          <TableCell className="font-medium">{r.name}</TableCell>
                          <TableCell>
                            <EGPAmount amount={r.storedBalance} />
                          </TableCell>
                          <TableCell>
                            <EGPAmount amount={r.calculatedBalance} />
                          </TableCell>
                          <TableCell>
                            <span
                              className={
                                Math.abs(r.discrepancy) > 0.01
                                  ? "font-bold text-destructive"
                                  : "text-green-600"
                              }
                            >
                              <EGPAmount amount={r.discrepancy} />
                            </span>
                          </TableCell>
                          <TableCell>
                            {Math.abs(r.discrepancy) > 0.01 ? (
                              <Badge variant="destructive">فروقات</Badge>
                            ) : (
                              <Badge variant="default">متطابق</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">تسوية أرصدة شركات التنفيذ</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">#</TableHead>
                      <TableHead className="text-right">اسم الشركة</TableHead>
                      <TableHead className="text-right">الرصيد المخزّن</TableHead>
                      <TableHead className="text-right">الرصيد المحسوب</TableHead>
                      <TableHead className="text-right">إجمالي المستحق</TableHead>
                      <TableHead className="text-right">إجمالي المدفوع</TableHead>
                      <TableHead className="text-right">الفرق</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {execReconciliation.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          لا توجد شركات تنفيذ مسجلة
                        </TableCell>
                      </TableRow>
                    ) : (
                      execReconciliation.map((r) => (
                        <TableRow key={String(r.id)}>
                          <TableCell className="font-medium">{String(r.id)}</TableCell>
                          <TableCell className="font-medium">{r.name}</TableCell>
                          <TableCell>
                            <EGPAmount amount={r.storedBalance} />
                          </TableCell>
                          <TableCell>
                            <EGPAmount amount={r.calculatedBalance} />
                          </TableCell>
                          <TableCell>
                            <EGPAmount amount={r.totalOwed} />
                          </TableCell>
                          <TableCell>
                            <EGPAmount amount={r.totalPaid} />
                          </TableCell>
                          <TableCell>
                            <span
                              className={
                                Math.abs(r.discrepancy) > 0.01
                                  ? "font-bold text-destructive"
                                  : "text-green-600"
                              }
                            >
                              <EGPAmount amount={r.discrepancy} />
                            </span>
                          </TableCell>
                          <TableCell>
                            {Math.abs(r.discrepancy) > 0.01 ? (
                              <Badge variant="destructive">فروقات</Badge>
                            ) : (
                              <Badge variant="default">متطابق</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
