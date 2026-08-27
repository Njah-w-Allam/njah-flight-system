"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
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
  OfferStatusBadge,
  PaymentStatusBadge,
  EGPAmount,
} from "@/components/status-badges";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  FileText,
  CalendarCheck,
  CreditCard,
  BookOpen,
  Search,
} from "lucide-react";

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

export function CompanyDetailClient({ company }: { company: any }) {
  const [bookingSearch, setBookingSearch] = useState("");

  const totalExecutionPayments = company.execution_payments.reduce(
    (sum: number, p: any) => sum + Number(p.amount),
    0
  );

  const totalExecutionCost = company.execution_offers.reduce(
    (sum: number, o: any) => sum + Number(o.execution_cost),
    0
  );

  const filteredBookings = company.bookings.filter(
    (b: any) =>
      !bookingSearch ||
      b.customer.name.includes(bookingSearch) ||
      (b.booking_reference && b.booking_reference.includes(bookingSearch)) ||
      String(b.id).includes(bookingSearch)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{company.name}</h1>
            <Badge variant="secondary">شركة تنفيذ</Badge>
          </div>
          {company.contact_person && (
            <p className="text-muted-foreground mt-1">
              جهة الاتصال: {company.contact_person}
              {company.phone && ` | الهاتف: ${company.phone}`}
            </p>
          )}
        </div>
        <Link href="/execution-companies">
          <Button variant="outline">
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة للقائمة
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="offers" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            العروض ({company.execution_offers.length})
          </TabsTrigger>
          <TabsTrigger value="bookings" className="flex items-center gap-1">
            <CalendarCheck className="h-4 w-4" />
            الحجوزات ({company.bookings.length})
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-1">
            <CreditCard className="h-4 w-4" />
            المدفوعات ({company.execution_payments.length})
          </TabsTrigger>
          <TabsTrigger value="statement" className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            كشف الحساب
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  بيانات الشركة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">اسم الشركة</span>
                  <span className="font-medium">{company.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">جهة الاتصال</span>
                  <span className="font-medium">
                    {company.contact_person || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">رقم الهاتف</span>
                  <span className="font-medium num-ltr">
                    {company.phone || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">العنوان</span>
                  <span className="font-medium">{company.address || "—"}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">تاريخ الإنشاء</span>
                  <span className="font-medium">
                    {formatDateTime(company.created_at)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">آخر تحديث</span>
                  <span className="font-medium">
                    {formatDateTime(company.updated_at)}
                  </span>
                </div>
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
                      Number(company.balance) > 0
                        ? "text-green-600 font-bold"
                        : Number(company.balance) < 0
                          ? "text-destructive font-bold"
                          : "font-bold"
                    }
                  >
                    <EGPAmount amount={company.balance} />
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">إجمالي العروض</span>
                  <span className="font-medium">
                    {company.execution_offers.length} عرض
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">إجمالي تكاليف التنفيذ</span>
                  <EGPAmount amount={totalExecutionCost} />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">عدد الحجوزات</span>
                  <span className="font-medium">
                    {company.bookings.length} حجز
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">إجمالي المدفوعات</span>
                  <EGPAmount amount={totalExecutionPayments} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Offers Tab */}
        <TabsContent value="offers">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">#</TableHead>
                      <TableHead className="text-right">العميل</TableHead>
                      <TableHead className="text-right">الناقل</TableHead>
                      <TableHead className="text-right">المسار</TableHead>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">التكلفة</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">الاستلام</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {company.execution_offers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-8 text-muted-foreground"
                        >
                          لا توجد عروض
                        </TableCell>
                      </TableRow>
                    ) : (
                      company.execution_offers.map((offer: any) => (
                        <TableRow key={offer.id}>
                          <TableCell className="font-medium">
                            {String(offer.id)}
                          </TableCell>
                          <TableCell>
                            {offer.request?.customer?.name || "—"}
                          </TableCell>
                          <TableCell>{offer.airline.name}</TableCell>
                          <TableCell>
                            {offer.request?.origin && offer.request?.destination
                              ? `${offer.request.origin} → ${offer.request.destination}`
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{offer.offer_type}</Badge>
                          </TableCell>
                          <TableCell>
                            <EGPAmount amount={offer.execution_cost} />
                          </TableCell>
                          <TableCell>
                            <OfferStatusBadge status={offer.status} />
                          </TableCell>
                          <TableCell>
                            {formatDateTime(offer.received_at)}
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

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو رقم الحجز..."
              value={bookingSearch}
              onChange={(e) => setBookingSearch(e.target.value)}
              className="pr-9"
            />
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">#</TableHead>
                      <TableHead className="text-right">العميل</TableHead>
                      <TableHead className="text-right">المسار</TableHead>
                      <TableHead className="text-right">الناقل</TableHead>
                      <TableHead className="text-right">تاريخ السفر</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">سعر الشراء</TableHead>
                      <TableHead className="text-right">سعر البيع</TableHead>
                      <TableHead className="text-right">الربح</TableHead>
                      <TableHead className="text-right">تفاصيل</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={10}
                          className="text-center py-8 text-muted-foreground"
                        >
                          لا توجد حجوزات
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBookings.map((booking: any) => {
                        const firstSegment = booking.flight_segments[0];
                        const lastSegment =
                          booking.flight_segments[
                            booking.flight_segments.length - 1
                          ];
                        return (
                          <TableRow key={booking.id}>
                            <TableCell className="font-medium">
                              {String(booking.id)}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {booking.customer.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {booking.customer.phone}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {firstSegment && (
                                <span>
                                  {firstSegment.from_location}
                                  {lastSegment &&
                                  lastSegment !== firstSegment
                                    ? ` → ${lastSegment.to_location}`
                                    : ""}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {booking.selected_offer?.airline.name ?? "—"}
                            </TableCell>
                            <TableCell>
                              {formatDate(booking.depart_date)}
                            </TableCell>
                            <TableCell>
                              <BookingStatusBadge
                                status={booking.booking_status}
                              />
                            </TableCell>
                            <TableCell>
                              <EGPAmount
                                amount={booking.current_purchase_price}
                              />
                            </TableCell>
                            <TableCell>
                              <EGPAmount
                                amount={booking.current_selling_price}
                              />
                            </TableCell>
                            <TableCell>
                              <span
                                className={
                                  Number(booking.current_profit) >= 0
                                    ? "text-green-600"
                                    : "text-destructive"
                                }
                              >
                                <EGPAmount amount={booking.current_profit} />
                              </span>
                            </TableCell>
                            <TableCell>
                              <Link href={`/bookings/${booking.id}`}>
                                <Button variant="ghost" size="icon">
                                  <ArrowRight className="h-4 w-4" />
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

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">#</TableHead>
                      <TableHead className="text-right">الحجز</TableHead>
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">ملاحظات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {company.execution_payments.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          لا توجد مدفوعات
                        </TableCell>
                      </TableRow>
                    ) : (
                      company.execution_payments.map((payment: any) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">
                            {String(payment.id)}
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/bookings/${payment.booking.id}`}
                              className="text-primary hover:underline"
                            >
                              حجز #{String(payment.booking.id)}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <EGPAmount amount={payment.amount} />
                          </TableCell>
                          <TableCell>
                            {formatDateTime(payment.payment_date)}
                          </TableCell>
                          <TableCell>
                            <PaymentStatusBadge status={payment.status} />
                          </TableCell>
                          <TableCell>{payment.notes || "—"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Statement Tab */}
        <TabsContent value="statement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">كشف الحساب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">الرصيد الحالي</div>
                  <div
                    className={`text-2xl font-bold mt-1 ${
                      Number(company.balance) > 0
                        ? "text-green-600"
                        : Number(company.balance) < 0
                          ? "text-destructive"
                          : ""
                    }`}
                  >
                    <EGPAmount amount={company.balance} />
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">إجمالي المدفوعات الصادرة</div>
                  <div className="text-2xl font-bold mt-1">
                    <EGPAmount amount={totalExecutionPayments} />
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">إجمالي تكاليف العروض</div>
                  <div className="text-2xl font-bold mt-1">
                    <EGPAmount amount={totalExecutionCost} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">المرجع</TableHead>
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead className="text-right">الرصيد</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const entries: {
                        date: Date | string;
                        type: string;
                        reference: string;
                        amount: number;
                        runningBalance: number;
                      }[] = [];

                      company.execution_payments.forEach((p: any) => {
                        entries.push({
                          date: p.payment_date,
                          type: "دفعة صادرة",
                          reference: `حجز #${String(p.booking.id)}`,
                          amount: Number(p.amount),
                          runningBalance: 0,
                        });
                      });

                      company.execution_offers.forEach((o: any) => {
                        entries.push({
                          date: o.created_at,
                          type: "عرض تنفيذ",
                          reference: `عرض #${String(o.id)}`,
                          amount: -Number(o.execution_cost),
                          runningBalance: 0,
                        });
                      });

                      entries.sort(
                        (a, b) =>
                          new Date(b.date).getTime() -
                          new Date(a.date).getTime()
                      );

                      let balance = Number(company.balance);
                      for (let i = entries.length - 1; i >= 0; i--) {
                        entries[i].runningBalance = balance;
                        balance -= entries[i].amount;
                      }

                      if (entries.length === 0) {
                        return (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="text-center py-8 text-muted-foreground"
                            >
                              لا توجد حركات
                            </TableCell>
                          </TableRow>
                        );
                      }

                      return entries.map((entry, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{formatDateTime(entry.date)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                entry.type === "دفعة صادرة"
                                  ? "default"
                                  : "outline"
                              }
                            >
                              {entry.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{entry.reference}</TableCell>
                          <TableCell>
                            <span
                              className={
                                entry.amount >= 0
                                  ? "text-green-600"
                                  : "text-destructive"
                              }
                            >
                              {entry.amount >= 0 ? "+" : ""}
                              <EGPAmount amount={entry.amount} />
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">
                            <EGPAmount amount={entry.runningBalance} />
                          </TableCell>
                        </TableRow>
                      ));
                    })()}
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
