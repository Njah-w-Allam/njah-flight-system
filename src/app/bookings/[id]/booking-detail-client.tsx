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
  TicketStatusBadge,
  SeverityBadge,
  EGPAmount,
} from "@/components/status-badges";
import Link from "next/link";
import {
  ArrowRight,
  Plane,
  Users,
  Ticket,
  CreditCard,
  Clock,
  AlertTriangle,
  History,
  FileText,
} from "lucide-react";

function formatDate(date: Date | string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("ar-EG-u-nu-latn", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(date: Date | string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleString("ar-EG-u-nu-latn", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BookingDetailClient({ booking }: { booking: any }) {
  const totalCustomerPayments = booking.customer_payments.reduce(
    (sum: number, p: any) => sum + Number(p.amount),
    0
  );
  const totalExecutionPayments = booking.execution_payments.reduce(
    (sum: number, p: any) => sum + Number(p.amount),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">حجز #{String(booking.id)}</h1>
            <BookingStatusBadge status={booking.booking_status} />
            {booking.issued_before_payment && (
              <Badge variant="destructive">إصدار قبل الدفع</Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            العميل: {booking.customer.name} | شركة التنفيذ: {booking.execution_company.name}
          </p>
        </div>
      </div>

      {/* Route Visual */}
      {booking.flight_segments.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {booking.flight_segments.map((seg: any, idx: number) => (
                <div key={seg.id} className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{seg.from_location}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDateTime(seg.departure_at)}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Plane className="h-6 w-6 text-primary rotate-[270deg]" />
                    <Badge variant="outline" className="text-xs">
                      {seg.airline.name}
                    </Badge>
                    {seg.flight_number && (
                      <span className="text-xs text-muted-foreground">{seg.flight_number}</span>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{seg.to_location}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDateTime(seg.arrival_at)}
                    </div>
                  </div>
                  {idx < booking.flight_segments.length - 1 && (
                    <div className="mx-4 text-muted-foreground">→</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="tickets" className="flex items-center gap-1">
            <Ticket className="h-4 w-4" />
            التذاكر ({booking.tickets.length})
          </TabsTrigger>
          <TabsTrigger value="passengers" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            المسافرين ({booking.passengers.length})
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-1">
            <CreditCard className="h-4 w-4" />
            المدفوعات
          </TabsTrigger>
          <TabsTrigger value="price-history" className="flex items-center gap-1">
            <History className="h-4 w-4" />
            تاريخ الأسعار
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            التنبيهات ({booking.alerts.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">بيانات الحجز</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">رقم الحجز</span>
                  <span className="font-medium">#{String(booking.id)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">مرجع الحجز</span>
                  <span className="font-medium">{booking.booking_reference || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">تاريخ السفر</span>
                  <span className="font-medium">{formatDate(booking.depart_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">تاريخ العودة</span>
                  <span className="font-medium">{formatDate(booking.return_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">تاريخ الإنشاء</span>
                  <span className="font-medium">{formatDateTime(booking.created_at)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">البيانات المالية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">سعر الشراء</span>
                  <EGPAmount amount={booking.current_purchase_price} />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">سعر البيع</span>
                  <EGPAmount amount={booking.current_selling_price} />
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span className="text-muted-foreground">الربح</span>
                  <span className={Number(booking.current_profit) >= 0 ? "text-green-600" : "text-destructive"}>
                    <EGPAmount amount={booking.current_profit} />
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">مدفوعات العميل</span>
                  <EGPAmount amount={totalCustomerPayments} />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">مدفوعات شركة التنفيذ</span>
                  <EGPAmount amount={totalExecutionPayments} />
                </div>
              </CardContent>
            </Card>
          </div>

          {booking.risk_reason && (
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-base text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  ملاحظة مخاطرة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">وافق على الإصدار</span>
                  <span className="font-medium">{booking.risk_approved_by}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">السبب</span>
                  <span className="font-medium">{booking.risk_reason}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم التذكرة</TableHead>
                    <TableHead className="text-right">PNR</TableHead>
                    <TableHead className="text-right">الناقل</TableHead>
                    <TableHead className="text-right">السعر</TableHead>
                    <TableHead className="text-right">تاريخ الإصدار</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {booking.tickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        لا توجد تذاكر بعد
                      </TableCell>
                    </TableRow>
                  ) : (
                    booking.tickets.map((ticket: any) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium">{ticket.ticket_number || "—"}</TableCell>
                        <TableCell>{ticket.pnr || "—"}</TableCell>
                        <TableCell>{ticket.airline.name}</TableCell>
                        <TableCell><EGPAmount amount={ticket.ticket_price} /></TableCell>
                        <TableCell>{formatDateTime(ticket.issue_date)}</TableCell>
                        <TableCell><TicketStatusBadge status={ticket.status} /></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Passengers Tab */}
        <TabsContent value="passengers">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الاسم</TableHead>
                    <TableHead className="text-right">رقم الجواز</TableHead>
                    <TableHead className="text-right">الجنسية</TableHead>
                    <TableHead className="text-right">تاريخ الميلاد</TableHead>
                    <TableHead className="text-right">ملاحظات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {booking.passengers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        لا يوجد مسافرين
                      </TableCell>
                    </TableRow>
                  ) : (
                    booking.passengers.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.passport_number || "—"}</TableCell>
                        <TableCell>{p.nationality || "—"}</TableCell>
                        <TableCell>{formatDate(p.date_of_birth)}</TableCell>
                        <TableCell>{p.notes || "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">مدفوعات العميل ({booking.customer_payments.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المبلغ</TableHead>
                    <TableHead className="text-right">الطريقة</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">ملاحظات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {booking.customer_payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        لا توجد مدفوعات
                      </TableCell>
                    </TableRow>
                  ) : (
                    booking.customer_payments.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium"><EGPAmount amount={p.amount} /></TableCell>
                        <TableCell>{p.payment_method}</TableCell>
                        <TableCell>{formatDateTime(p.payment_date)}</TableCell>
                        <TableCell>{p.notes || "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">مدفوعات شركة التنفيذ ({booking.execution_payments.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المبلغ</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">ملاحظات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {booking.execution_payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                        لا توجد مدفوعات
                      </TableCell>
                    </TableRow>
                  ) : (
                    booking.execution_payments.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium"><EGPAmount amount={p.amount} /></TableCell>
                        <TableCell>{formatDateTime(p.payment_date)}</TableCell>
                        <TableCell>{p.notes || "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Price History Tab */}
        <TabsContent value="price-history">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">سعر الشراء</TableHead>
                    <TableHead className="text-right">سعر البيع</TableHead>
                    <TableHead className="text-right">الربح</TableHead>
                    <TableHead className="text-right">المُغيِّر</TableHead>
                    <TableHead className="text-right">السبب</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {booking.price_history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        لا يوجد تاريخ أسعار
                      </TableCell>
                    </TableRow>
                  ) : (
                    booking.price_history.map((ph: any) => (
                      <TableRow key={ph.id}>
                        <TableCell>{formatDateTime(ph.changed_at)}</TableCell>
                        <TableCell><EGPAmount amount={ph.execution_cost} /></TableCell>
                        <TableCell><EGPAmount amount={ph.selling_price} /></TableCell>
                        <TableCell>
                          <span className={Number(ph.profit) >= 0 ? "text-green-600" : "text-destructive"}>
                            <EGPAmount amount={ph.profit} />
                          </span>
                        </TableCell>
                        <TableCell>{ph.changed_by || "—"}</TableCell>
                        <TableCell>{ph.reason || "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">النوع</TableHead>
                    <TableHead className="text-right">الشدة</TableHead>
                    <TableHead className="text-right">الرسالة</TableHead>
                    <TableHead className="text-right">الموعد</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {booking.alerts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        لا توجد تنبيهات مفتوحة
                      </TableCell>
                    </TableRow>
                  ) : (
                    booking.alerts.map((alert: any) => (
                      <TableRow key={alert.id}>
                        <TableCell>{alert.type}</TableCell>
                        <TableCell><SeverityBadge severity={alert.severity} /></TableCell>
                        <TableCell>{alert.message}</TableCell>
                        <TableCell>{formatDateTime(alert.due_date)}</TableCell>
                        <TableCell>
                          <Badge variant={alert.status === "open" ? "destructive" : "default"}>
                            {alert.status === "open" ? "مفتوح" : "مغلق"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
