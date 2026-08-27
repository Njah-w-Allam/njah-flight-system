"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TicketStatusBadge, BookingStatusBadge, EGPAmount } from "@/components/status-badges";
import Link from "next/link";
import { Plane, Clock, Phone, User, ArrowLeft } from "lucide-react";

interface Ticket {
  ticket_id: bigint;
  ticket_number: string | null;
  pnr: string | null;
  ticket_status: string;
  ticket_price: any;
  currency: string;
  airline_name: string;
  airline_code: string | null;
  departure_at: Date;
  arrival_at: Date;
  from_location: string;
  to_location: string;
  flight_number: string | null;
  terminal: string | null;
  class: string | null;
  baggage: string | null;
  customer_name: string;
  customer_phone: string;
  customer_id: bigint;
  booking_id: bigint;
  booking_status: string;
  current_selling_price: any;
  current_purchase_price: any;
}

function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleString("ar-EG-u-nu-latn", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeUntil(date: Date | string) {
  const diff = new Date(date).getTime() - Date.now();
  if (diff < 0) return "غادرت";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) return "أكثر من 24 ساعة";
  if (hours > 0) return `${hours} ساعة و ${minutes} دقيقة`;
  return `${minutes} دقيقة`;
}

function getUrgencyLevel(date: Date | string): "critical" | "warning" | "normal" {
  const diff = new Date(date).getTime() - Date.now();
  const hours = diff / (1000 * 60 * 60);
  if (hours <= 2) return "critical";
  if (hours <= 6) return "warning";
  return "normal";
}

export function UpcomingTicketsClient({ tickets }: { tickets: Ticket[] }) {
  const criticalCount = tickets.filter(
    (t) => getUrgencyLevel(t.departure_at) === "critical"
  ).length;
  const warningCount = tickets.filter(
    (t) => getUrgencyLevel(t.departure_at) === "warning"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Plane className="h-6 w-6" />
            التذاكر القريبة الرحيل
          </h1>
          <p className="text-muted-foreground mt-1">
            كل تذكرة موعد إقلاعها خلال 24 ساعة القادمة
          </p>
        </div>
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <Badge variant="destructive">{criticalCount} حرج</Badge>
          )}
          {warningCount > 0 && (
            <Badge variant="outline" className="border-yellow-500 text-yellow-600">
              {warningCount} تنبيه
            </Badge>
          )}
          <Badge variant="secondary">{tickets.length} تذكرة</Badge>
        </div>
      </div>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Plane className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">
              لا توجد تذاكر موعد إقلاعها خلال 24 ساعة القادمة
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const urgency = getUrgencyLevel(ticket.departure_at);
            return (
              <Card
                key={ticket.ticket_id}
                className={
                  urgency === "critical"
                    ? "border-destructive bg-destructive/5"
                    : urgency === "warning"
                    ? "border-yellow-500 bg-yellow-500/5"
                    : ""
                }
              >
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    {/* Right side - Flight info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{ticket.customer_name}</span>
                        <Link
                          href={`/customers/${ticket.customer_id}`}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Link>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {ticket.customer_phone}
                        </span>
                        <span>حجز #{String(ticket.booking_id)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{ticket.airline_name}</Badge>
                        {ticket.flight_number && (
                          <span className="text-sm font-medium">{ticket.flight_number}</span>
                        )}
                        {ticket.pnr && (
                          <span className="text-sm text-muted-foreground">PNR: {ticket.pnr}</span>
                        )}
                        {ticket.ticket_number && (
                          <span className="text-sm text-muted-foreground">رقم التذكرة: {ticket.ticket_number}</span>
                        )}
                      </div>
                    </div>

                    {/* Middle - Route */}
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold">{ticket.from_location}</div>
                        <div className="text-xs text-muted-foreground">المغادرة</div>
                      </div>
                      <div className="flex flex-col items-center">
                        <Plane className="h-5 w-5 text-muted-foreground rotate-[270deg]" />
                        <div className="text-xs text-muted-foreground">
                          {ticket.class && `${ticket.class} | `}
                          {ticket.baggage && `أمتعة: ${ticket.baggage}`}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{ticket.to_location}</div>
                        <div className="text-xs text-muted-foreground">الوصول</div>
                      </div>
                    </div>

                    {/* Left side - Time & Status */}
                    <div className="flex flex-col items-end gap-2">
                      <div
                        className={`flex items-center gap-1 font-bold ${
                          urgency === "critical"
                            ? "text-destructive"
                            : urgency === "warning"
                            ? "text-yellow-600"
                            : ""
                        }`}
                      >
                        <Clock className="h-4 w-4" />
                        {timeUntil(ticket.departure_at)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDateTime(ticket.departure_at)}
                      </div>
                      {ticket.terminal && (
                        <div className="text-xs text-muted-foreground">
                          مterminal: {ticket.terminal}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <TicketStatusBadge status={ticket.ticket_status as any} />
                        <BookingStatusBadge status={ticket.booking_status as any} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
