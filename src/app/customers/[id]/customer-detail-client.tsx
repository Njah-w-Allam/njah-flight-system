"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  BookingStatusBadge,
  PaymentStatusBadge,
  EGPAmount,
} from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  User,
  Plane,
  CreditCard,
  FileText,
  ArrowLeft,
  Phone,
  MapPin,
} from "lucide-react";
import { credit_status_enum, payment_method_enum } from "@prisma/client";

const creditStatusMap: Record<
  credit_status_enum,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  NEW: { label: "جديد", variant: "secondary" },
  TRUSTED: { label: "موثوق", variant: "default" },
  RESTRICTED: { label: "مقيّد", variant: "destructive" },
};

const paymentMethodMap: Record<payment_method_enum, string> = {
  cash: "نقدي",
  instapay: "انستاباي",
  vodafone_cash: "فودافون كاش",
};

function formatDate(date: Date | string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(date: Date | string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CustomerDetailClient({ customer }: { customer: any }) {
  const customerStatus = customer.credit_status as credit_status_enum;
  const totalPaid = customer.customer_payments.reduce(
    (sum: number, p: any) => sum + Number(p.amount),
    0
  );

  const statementEntries: {
    date: Date;
    description: string;
    debit: number;
    credit: number;
    runningBalance: number;
  }[] = [];

  for (const booking of customer.bookings) {
    if (Number(booking.current_selling_price) > 0) {
      statementEntries.push({
        date: booking.created_at,
        description: `حجز #${String(booking.id)} — ${booking.flight_segments[0]?.from_location ?? ""}${booking.flight_segments[0] ? " → " + (booking.flight_segments[booking.flight_segments.length - 1]?.to_location ?? "") : ""}`,
        debit: Number(booking.current_selling_price),
        credit: 0,
        runningBalance: 0,
      });
    }
  }

  for (const payment of customer.customer_payments) {
    statementEntries.push({
      date: payment.payment_date,
      description: `دفعة — ${paymentMethodMap[payment.payment_method as payment_method_enum] || payment.payment_method}${payment.booking?.booking_reference ? ` (حجز #${String(payment.booking.id)})` : ""}`,
      debit: 0,
      credit: Number(payment.amount),
      runningBalance: 0,
    });
  }

  statementEntries.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let running = 0;
  for (const entry of statementEntries) {
    running = running + entry.debit - entry.credit;
    entry.runningBalance = running;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{customer.name}</h1>
            <Badge variant={creditStatusMap[customerStatus].variant}>
              {creditStatusMap[customerStatus].label}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              {customer.phone}
            </span>
            {customer.address && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {customer.address}
              </span>
            )}
          </p>
        </div>
        <Link href="/customers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="ml-1 h-4 w-4" />
            العودة للعملاء
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <User className="h-4 w-4" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="bookings" className="flex items-center gap-1">
            <Plane className="h-4 w-4" />
            الحجوزات ({customer.bookings.length})
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-1">
            <CreditCard className="h-4 w-4" />
            سجل المدفوعات ({customer.customer_payments.length})
          </TabsTrigger>
          <TabsTrigger value="statement" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            كشف الحساب
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">بيانات العميل</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الاسم</span>
                  <span className="font-medium">{customer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الهاتف</span>
                  <span className="font-medium" dir="ltr">
                    {customer.phone}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">العنوان</span>
                  <span className="font-medium">
                    {customer.address || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">حالة الرصيد</span>
                  <Badge
                    variant={creditStatusMap[customerStatus].variant}
                  >
                    {creditStatusMap[customerStatus].label}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">العملة</span>
                  <span className="font-medium">{customer.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">تاريخ التسجيل</span>
                  <span className="font-medium">
                    {formatDateTime(customer.created_at)}
                  </span>
                </div>
                {customer.notes && (
                  <>
                    <Separator />
                    <div>
                      <span className="text-muted-foreground text-sm">
                        ملاحظات
                      </span>
                      <p className="mt-1 text-sm">{customer.notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">الملخص المالي</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الرصيد الحالي</span>
                  <span
                    className={
                      Number(customer.balance) >= 0
                        ? "text-green-600 font-bold"
                        : "text-destructive font-bold"
                    }
                  >
                    <EGPAmount amount={customer.balance} />
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    إجمالي المدفوعات
                  </span>
                  <EGPAmount amount={totalPaid} />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">عدد الحجوزات</span>
                  <span className="font-medium">
                    {customer.bookings.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    عدد المدفوعات
                  </span>
                  <span className="font-medium">
                    {customer.customer_payments.length}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">ملخص الحجوزات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { status: "COMPLETED", label: "مكتملة" },
                  { status: "TICKETED", label: "تم الإصدار" },
                  { status: "WAITING_PAYMENT", label: "بانتظار الدفع" },
                  { status: "WAITING_TICKETING", label: "بانتظار الإصدار" },
                  { status: "NEW", label: "جديدة" },
                  { status: "CANCELLED", label: "ملغية" },
                ].map(({ status, label }) => {
                  const count = customer.bookings.filter(
                    (b: any) => b.booking_status === status
                  ).length;
                  if (count === 0) return null;
                  return (
                    <div key={status} className="flex justify-between">
                      <span className="text-muted-foreground">{label}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  );
                })}
                {customer.bookings.length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-2">
                    لا توجد حجوزات بعد
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bookings">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم الحجز</TableHead>
                      <TableHead className="text-right">المسار</TableHead>
                      <TableHead className="text-right">
                        شركة التنفيذ
                      </TableHead>
                      <TableHead className="text-right">الناقل</TableHead>
                      <TableHead className="text-right">تاريخ السفر</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">سعر البيع</TableHead>
                      <TableHead className="text-right">التذاكر</TableHead>
                      <TableHead className="text-right">التفاصيل</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customer.bookings.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="text-center py-8 text-muted-foreground"
                        >
                          لا توجد حجوزات لهذا العميل
                        </TableCell>
                      </TableRow>
                    ) : (
                      customer.bookings.map((booking: any) => {
                        const firstSeg = booking.flight_segments[0];
                        const lastSeg =
                          booking.flight_segments[
                            booking.flight_segments.length - 1
                          ];
                        return (
                          <TableRow key={booking.id}>
                            <TableCell className="font-medium">
                              #{String(booking.id)}
                              {booking.booking_reference && (
                                <span className="text-muted-foreground text-xs mr-1">
                                  ({booking.booking_reference})
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {firstSeg && (
                                <span>
                                  {firstSeg.from_location}
                                  {lastSeg && lastSeg !== firstSeg
                                    ? ` → ${lastSeg.to_location}`
                                    : ""}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>{booking.execution_company.name}</TableCell>
                            <TableCell>
                              {booking.selected_offer?.airline.name ?? "—"}
                            </TableCell>
                            <TableCell>{formatDate(booking.depart_date)}</TableCell>
                            <TableCell>
                              <BookingStatusBadge
                                status={booking.booking_status}
                              />
                            </TableCell>
                            <TableCell>
                              <EGPAmount
                                amount={booking.current_selling_price}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {booking.tickets.map((t: any) => (
                                  <Badge
                                    key={t.id}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {t.status === "issued"
                                      ? "✓"
                                      : t.status === "cancelled"
                                        ? "✗"
                                        : "○"}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Link href={`/bookings/${booking.id}`}>
                                <Button variant="ghost" size="icon">
                                  <ArrowLeft className="h-4 w-4" />
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">#</TableHead>
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead className="text-right">الطريقة</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">الحجز المرتبط</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">ملاحظات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customer.customer_payments.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-muted-foreground"
                        >
                          لا توجد مدفوعات لهذا العميل
                        </TableCell>
                      </TableRow>
                    ) : (
                      customer.customer_payments.map((payment: any) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">
                            {String(payment.id)}
                          </TableCell>
                          <TableCell>
                            <EGPAmount amount={payment.amount} />
                          </TableCell>
                          <TableCell>
                            {paymentMethodMap[payment.payment_method as payment_method_enum] ||
                              payment.payment_method}
                          </TableCell>
                          <TableCell>
                            {formatDateTime(payment.payment_date)}
                          </TableCell>
                          <TableCell>
                            {payment.booking ? (
                              <Link
                                href={`/bookings/${payment.booking.id}`}
                                className="text-primary hover:underline"
                              >
                                حجز #{String(payment.booking.id)}
                              </Link>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            <PaymentStatusBadge status={payment.status} />
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {payment.notes || "—"}
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

        <TabsContent value="statement">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">كشف حساب العميل</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">البيان</TableHead>
                      <TableHead className="text-right">مدين</TableHead>
                      <TableHead className="text-right">دائن</TableHead>
                      <TableHead className="text-right">الرصيد</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statementEntries.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-muted-foreground"
                        >
                          لا توجد حركات في كشف الحساب
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {statementEntries.map((entry, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{formatDate(entry.date)}</TableCell>
                            <TableCell>{entry.description}</TableCell>
                            <TableCell>
                              {entry.debit > 0 ? (
                                <EGPAmount amount={entry.debit} />
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell>
                              {entry.credit > 0 ? (
                                <span className="text-green-600">
                                  <EGPAmount amount={entry.credit} />
                                </span>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell>
                              <span
                                className={
                                  entry.runningBalance >= 0
                                    ? "font-medium"
                                    : "font-medium text-destructive"
                                }
                              >
                                <EGPAmount amount={entry.runningBalance} />
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50">
                          <TableCell colSpan={4} className="font-bold text-left">
                            الرصيد النهائي
                          </TableCell>
                          <TableCell>
                            <span
                              className={
                                Number(customer.balance) >= 0
                                  ? "font-bold text-green-600"
                                  : "font-bold text-destructive"
                              }
                            >
                              <EGPAmount amount={customer.balance} />
                            </span>
                          </TableCell>
                        </TableRow>
                      </>
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
