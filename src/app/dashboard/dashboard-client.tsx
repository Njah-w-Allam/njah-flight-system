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
import { Button } from "@/components/ui/button";
import { QuickActions } from "@/components/quick-actions";
import { InProgressWork } from "@/components/in-progress-work";
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
  Flame,
  Zap,
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
  inProgressBookings: any[];
  waitingRequests: any[];
  activeCustomers: any[];
  airlines: any[];
  executionCompanies: any[];
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

export function DashboardClient({
  todayBookings,
  newBookings,
  upcomingTickets,
  ticketingDeadlines,
  customersInDebt,
  overduePayments,
  executionDue,
  openAlerts,
  inProgressBookings,
  waitingRequests,
  activeCustomers,
  airlines,
  executionCompanies,
}: DashboardProps) {
  const criticalAlerts = openAlerts.filter((a) => a.severity === "critical");
  const totalDebt = customersInDebt.reduce((sum, c) => sum + Number(c.balance), 0);
  const criticalTickets = upcomingTickets.filter(
    (t) => new Date(t.departure_at).getTime() - Date.now() <= 24 * 60 * 60 * 1000
  );
  const attentionCount =
    criticalTickets.length + newBookings.length + overduePayments.length;
  const totalOverdue =
    overduePayments.reduce((s, p) => s + Number(p.amount), 0) +
    executionDue.reduce((s, p) => s + Number(p.amount), 0);

  const todayFollowUps = ticketingDeadlines.slice(0, 4);

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

      {/* 🔴 Critical work now */}
      <Card className="border-destructive/40">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Flame className="h-5 w-5" />
            يحتاج تدخل الآن
          </CardTitle>
          <span className="text-sm text-muted-foreground">{attentionCount} عمل</span>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <CriticalBox
              label="تذاكر قريبة من الرحيل"
              value={criticalTickets.length}
              tone="destructive"
              href="/upcoming-tickets"
            />
            <CriticalBox
              label="حجوزات تحتاج دفع"
              value={overduePayments.length}
              tone="destructive"
            />
            <CriticalBox
              label="تذاكر تحتاج إصدار"
              value={newBookings.length}
              tone="destructive"
            />
          </div>
          {criticalTickets.length > 0 && (
            <div className="mt-4 space-y-2">
              {criticalTickets.slice(0, 3).map((t: any) => (
                <div key={t.ticket_id} className="flex items-center justify-between rounded-lg border bg-background p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{t.customer_name}</span>
                      <TicketStatusBadge status={t.ticket_status} />
                    </div>
                    <div className="truncate text-sm text-muted-foreground">
                      {t.airline_name} · {t.flight_number} · {t.from_location} ← {t.to_location}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-destructive text-sm font-medium">
                      <Clock className="h-4 w-4" />
                      {timeUntil(t.departure_at)}
                    </span>
                    <Link href={`/bookings/${t.booking_id}`}>
                      <Button size="sm" variant="outline">فتح</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ⚡ Quick actions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            إجراءات سريعة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <QuickActions
            customers={activeCustomers}
            airlines={airlines}
            companies={executionCompanies}
            bookings={inProgressBookings}
            requests={waitingRequests}
          />
        </CardContent>
      </Card>

      {/* 🟠 In-progress work */}
      <InProgressWork bookings={inProgressBookings} requests={waitingRequests} />

      {/* ⏰ Today's follow-ups */}
      {todayFollowUps.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              متابعات اليوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {todayFollowUps.map((offer) => (
                <div key={offer.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="font-medium">
                      {offer.execution_company.name}
                      <span className="mr-2 text-sm text-muted-foreground">
                        {offer.request?.origin} → {offer.request?.destination}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      موعد الإصدار: {formatDateTime(offer.ticketing_deadline)}
                    </div>
                  </div>
                  <Badge variant="secondary">
                    <Clock className="ml-1 h-3 w-3" />
                    {timeUntil(offer.ticketing_deadline)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 📊 Summary / statistics (secondary) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="حجوزات اليوم" value={todayBookings.length} icon={CalendarCheck} />
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

      {/* Command strip (attention summary) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className={cn("border-2", attentionCount > 0 ? "border-amber-500/60 bg-amber-500/5" : "border-emerald-500/60 bg-emerald-500/5")}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white", attentionCount > 0 ? "bg-amber-500" : "bg-emerald-600")}>
              {attentionCount > 0 ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
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
              <div className="text-xl font-bold"><EGPAmount amount={totalOverdue} /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* New Bookings (tested heading) */}
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
              <p className="py-4 text-center text-muted-foreground">لا توجد حجوزات جديدة</p>
            ) : (
              <div className="space-y-2">
                {newBookings.map((booking) => (
                  <Link key={booking.id} href={`/bookings/${booking.id}`} className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors">
                    <div>
                      <span className="font-medium">{booking.customer.name}</span>
                      <span className="mr-2 text-sm text-muted-foreground">#{booking.id}</span>
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
              <p className="py-4 text-center text-muted-foreground">لا توجد مواعيد إصدار قادمة</p>
            ) : (
              <div className="space-y-2">
                {ticketingDeadlines.map((offer) => (
                  <div key={offer.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <span className="font-medium">{offer.request?.origin} → {offer.request?.destination}</span>
                      <span className="mr-2 text-sm text-muted-foreground">{offer.execution_company.name}</span>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium">{formatDateTime(offer.ticketing_deadline)}</div>
                      <div className="text-xs text-muted-foreground">{timeUntil(offer.ticketing_deadline)}</div>
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
            <span className="text-sm text-muted-foreground">الإجمالي: <EGPAmount amount={totalDebt} /></span>
          </CardHeader>
          <CardContent>
            {customersInDebt.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground">لا يوجد عملاء مدينون</p>
            ) : (
              <div className="space-y-2">
                {customersInDebt.slice(0, 5).map((customer) => (
                  <Link key={customer.id} href={`/customers/${customer.id}`} className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors">
                    <div>
                      <span className="font-medium">{customer.name}</span>
                      <span className="mr-2 text-sm text-muted-foreground">{customer.phone}</span>
                    </div>
                    <span className="font-medium text-destructive"><EGPAmount amount={customer.balance} /></span>
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
              <p className="py-4 text-center text-muted-foreground">لا توجد تنبيهات مفتوحة</p>
            ) : (
              <div className="space-y-2">
                {openAlerts.slice(0, 6).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <SeverityBadge severity={alert.severity} />
                        <span className="text-sm font-medium">{alert.message}</span>
                      </div>
                      {alert.customer && <span className="text-xs text-muted-foreground">العميل: {alert.customer.name}</span>}
                    </div>
                    {alert.due_date && <span className="text-xs text-muted-foreground">{formatDateTime(alert.due_date)}</span>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CriticalBox({
  label,
  value,
  tone,
  href,
}: {
  label: string;
  value: number;
  tone: "destructive" | "warning";
  href?: string;
}) {
  const content = (
    <div className={cn("flex items-center justify-between rounded-lg border p-3", tone === "destructive" ? "border-destructive/40 bg-destructive/5" : "border-amber-500/40 bg-amber-500/5")}>
      <div>
        <div className="text-sm">{label}</div>
        <div className={cn("text-2xl font-bold", tone === "destructive" ? "text-destructive" : "text-amber-600")}>{value}</div>
      </div>
      {href && <span className="text-sm text-muted-foreground">عرض</span>}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
