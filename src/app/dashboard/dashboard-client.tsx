"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import {
  BookingStatusBadge,
  TicketStatusBadge,
  SeverityBadge,
  EGPAmount,
} from "@/components/status-badges";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  CalendarCheck,
  AlertTriangle,
  Ticket,
  Clock,
  ArrowLeft,
  Plane,
  Wallet,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardProps {
  todayBookings: any[];
  newBookings: any[];
  upcomingTickets: any[];
  ticketingDeadlines: any[];
  customersInDebt: any[];
  overduePayments: any[];
  executionDue: any[];
  openAlerts: any[];
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("ar-EG-u-nu-latn", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString("ar-EG-u-nu-latn", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeUntil(date: string | Date) {
  const diff = new Date(date).getTime() - Date.now();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours} ساعة و ${minutes} دقيقة`;
  return `${minutes} دقيقة`;
}

function SectionHeader({
  icon: Icon,
  title,
  action,
  tone = "default",
}: {
  icon: typeof Ticket;
  title: string;
  action?: React.ReactNode;
  tone?: "danger" | "default";
}) {
  return (
    <CardHeader
      className={cn(
        "flex flex-row items-center justify-between",
        tone === "danger" && "text-destructive"
      )}
    >
      <CardTitle className="flex items-center gap-2">
        <Icon className="h-5 w-5" />
        {title}
      </CardTitle>
      {action}
    </CardHeader>
  );
}

export function DashboardClient({
  todayBookings,
  newBookings,
  upcomingTickets,
  ticketingDeadlines,
  customersInDebt,
  overduePayments,
  executionDue,
  openAlerts,
}: DashboardProps) {
  const criticalAlerts = openAlerts.filter((a) => a.severity === "critical");
  const totalDebt = customersInDebt.reduce((sum, c) => sum + Number(c.balance), 0);
  // Near-departure tickets are the top operational priority.
  const criticalTickets = upcomingTickets.filter(
    (t) => new Date(t.departure_at).getTime() - Date.now() <= 24 * 60 * 60 * 1000
  );
  const attentionCount =
    criticalTickets.length + newBookings.length + overduePayments.length;
  const totalOverdue =
    overduePayments.reduce((s, p) => s + Number(p.amount), 0) +
    executionDue.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">لوحة التحكم</h1>
        <span className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("ar-EG-u-nu-latn", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>

      {/* Command-center status strip */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card
          className={cn(
            "border-2",
            attentionCount > 0
              ? "border-amber-500/60 bg-amber-500/5"
              : "border-emerald-500/60 bg-emerald-500/5"
          )}
        >
          <CardContent className="flex items-center gap-3 p-4">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white",
                attentionCount > 0 ? "bg-amber-500" : "bg-emerald-600"
              )}
            >
              {attentionCount > 0 ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="text-xs text-muted-foreground">تحتاج متابعة الآن</div>
              <div className="text-2xl font-bold">{attentionCount}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Plane className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">رحلات تُغادر خلال 24 ساعة</div>
              <div className="text-2xl font-bold">{criticalTickets.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">متأخرات جارية</div>
              <div className="text-xl font-bold">
                <EGPAmount amount={totalOverdue} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="حجوزات اليوم"
          value={todayBookings.length}
          icon={CalendarCheck}
        />
        <StatCard
          title="حجوزات جديدة (غير مؤكدة)"
          value={newBookings.length}
          icon={AlertTriangle}
          variant={newBookings.length > 0 ? "warning" : "default"}
        />
        <StatCard
          title="تذاكر قريبة الرحيل"
          value={upcomingTickets.length}
          icon={Ticket}
          variant={upcomingTickets.length > 0 ? "destructive" : "default"}
          description="خلال 24 ساعة القادمة"
        />
        <StatCard
          title="تنبيهات مفتوحة"
          value={openAlerts.length}
          icon={AlertTriangle}
          variant={criticalAlerts.length > 0 ? "destructive" : "default"}
          description={`${criticalAlerts.length} حرج`}
        />
      </div>

      {/* Upcoming Tickets - Critical Priority */}
      {upcomingTickets.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Plane className="h-5 w-5" />
              تذاكر قريبة الرحيل (خلال 24 ساعة)
            </CardTitle>
            <Link
              href="/upcoming-tickets"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
            >
              عرض الكل
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingTickets.slice(0, 5).map((ticket: any) => (
                <div
                  key={ticket.ticket_id}
                  className="flex items-center justify-between rounded-lg border bg-background p-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{ticket.customer_name}</span>
                      <TicketStatusBadge status={ticket.ticket_status} />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{ticket.airline_name}</span>
                      <span>{ticket.flight_number}</span>
                      <span>
                        {ticket.from_location} ← {ticket.to_location}
                      </span>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1 text-destructive font-medium">
                      <Clock className="h-4 w-4" />
                      {timeUntil(ticket.departure_at)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(ticket.departure_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* New Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              الحجوزات الجديدة
            </CardTitle>
            <span className="text-xs text-muted-foreground">بانتظار التأكيد</span>
          </CardHeader>
          <CardContent>
            {newBookings.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">لا توجد حجوزات جديدة</p>
            ) : (
              <div className="space-y-2">
                {newBookings.map((booking) => (
                  <Link
                    key={booking.id}
                    href={`/bookings/${booking.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
                  >
                    <div>
                      <span className="font-medium">{booking.customer.name}</span>
                      <span className="mr-2 text-sm text-muted-foreground">
                        #{booking.id}
                      </span>
                    </div>
                    <BookingStatusBadge status={booking.booking_status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ticketing Deadlines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              مواعيد الإصدار القادمة
            </CardTitle>
            <span className="text-xs text-muted-foreground">خلال 3 أيام</span>
          </CardHeader>
          <CardContent>
            {ticketingDeadlines.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">لا توجد مواعيد إصدار قادمة</p>
            ) : (
              <div className="space-y-2">
                {ticketingDeadlines.map((offer) => (
                  <div
                    key={offer.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <span className="font-medium">{offer.request?.origin} → {offer.request?.destination}</span>
                      <span className="mr-2 text-sm text-muted-foreground">
                        {offer.execution_company.name}
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium">
                        {formatDateTime(offer.ticketing_deadline)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {timeUntil(offer.ticketing_deadline)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customers in Debt */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              العملاء المدينون
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              الإجمالي: <EGPAmount amount={totalDebt} />
            </span>
          </CardHeader>
          <CardContent>
            {customersInDebt.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">لا يوجد عملاء مدينون</p>
            ) : (
              <div className="space-y-2">
                {customersInDebt.slice(0, 5).map((customer) => (
                  <Link
                    key={customer.id}
                    href={`/customers/${customer.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
                  >
                    <div>
                      <span className="font-medium">{customer.name}</span>
                      <span className="mr-2 text-sm text-muted-foreground">{customer.phone}</span>
                    </div>
                    <span className="text-destructive font-medium">
                      <EGPAmount amount={customer.balance} />
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Open Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              التنبيهات المفتوحة
            </CardTitle>
            <Badge variant="outline">{openAlerts.length}</Badge>
          </CardHeader>
          <CardContent>
            {openAlerts.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">لا توجد تنبيهات مفتوحة</p>
            ) : (
              <div className="space-y-2">
                {openAlerts.slice(0, 6).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <SeverityBadge severity={alert.severity} />
                        <span className="text-sm font-medium">{alert.message}</span>
                      </div>
                      {alert.customer && (
                        <span className="text-xs text-muted-foreground">
                          العميل: {alert.customer.name}
                        </span>
                      )}
                    </div>
                    {alert.due_date && (
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(alert.due_date)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue Payments */}
        {(overduePayments.length > 0 || executionDue.length > 0) && (
          <Card className="lg:col-span-2 border-destructive/40">
            <SectionHeader
              icon={AlertTriangle}
              title="المدفوعات المتأخرة"
              tone="danger"
            />
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {overduePayments.length > 0 && (
                  <div>
                    <h4 className="mb-2 font-medium text-muted-foreground">مدفوعات عملاء متأخرة</h4>
                    <div className="space-y-2">
                      {overduePayments.map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div>
                            <span className="font-medium">{payment.customer.name}</span>
                            <span className="mr-2 text-sm text-muted-foreground">
                              حجز #{payment.booking_id}
                            </span>
                          </div>
                          <EGPAmount amount={payment.amount} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {executionDue.length > 0 && (
                  <div>
                    <h4 className="mb-2 font-medium text-muted-foreground">مستحقات شركات التنفيذ</h4>
                    <div className="space-y-2">
                      {executionDue.map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div>
                            <span className="font-medium">{payment.execution_company.name}</span>
                            <span className="mr-2 text-sm text-muted-foreground">
                              حجز #{payment.booking_id}
                            </span>
                          </div>
                          <EGPAmount amount={payment.amount} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
