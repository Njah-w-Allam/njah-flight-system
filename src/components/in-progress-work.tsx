"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ListTodo, MessageSquarePlus, ChevronLeft } from "lucide-react";
import { effectiveBookingStatus, bookingNextAction, totalPaid } from "@/lib/booking-flow";

type InProgressBooking = {
  id: number | string;
  booking_reference?: string | null;
  booking_status: string;
  current_selling_price?: number | null;
  issued_before_payment?: boolean;
  updated_at?: string | Date;
  customer?: { name?: string } | null;
  flight_segments?: { from_location?: string; to_location?: string; departure_at?: string | null }[];
  customer_payments?: { amount?: number | null }[];
  tickets?: { status?: string }[];
};

type WaitingRequest = {
  id: number | string;
  origin: string;
  destination: string;
  depart_date?: string | Date | null;
  updated_at?: string | Date;
  status?: string;
  customer?: { name?: string } | null;
};

function timeAgo(date?: string | Date | null) {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `منذ ${days} يوم`;
}

function severityTone(severity: string) {
  if (severity === "critical") return "destructive";
  if (severity === "warning") return "warning";
  return "default";
}

export function InProgressWork({
  bookings,
  requests,
}: {
  bookings: InProgressBooking[];
  requests: WaitingRequest[];
}) {
  const total = bookings.length + requests.length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ListTodo className="h-5 w-5" />
          العمليات قيد التنفيذ
        </CardTitle>
        <Badge variant="outline">{total}</Badge>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="py-6 text-center text-muted-foreground">
            لا توجد عمليات قيد التنفيذ — كل شيء على ما يرام.
          </p>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => (
              <div
                key={`req-${r.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">
                      {r.customer?.name ?? "عميل"}
                    </span>
                    <MessageSquarePlus className="h-4 w-4 shrink-0 text-amber-600" />
                  </div>
                  <div className="truncate text-sm text-muted-foreground">
                    {r.origin} → {r.destination}
                    <span className="mr-2 text-xs">بانتظار عروض التنفيذ</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    آخر تحديث: {timeAgo(r.updated_at)}
                  </div>
                </div>
                <Link href={`/execution-offers?request=${r.id}`}>
                  <Button size="sm" variant="outline">
                    متابعة
                    <ChevronLeft className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ))}

            {bookings.map((b) => {
              const effective = effectiveBookingStatus(b);
              const next = bookingNextAction(b);
              const paid = totalPaid(b);
              const selling = Number(b.current_selling_price || 0);
              const first = b.flight_segments?.[0];
              const tone = severityTone(next?.severity ?? "info");
              return (
                <div
                  key={`bk-${b.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">
                        {b.customer?.name ?? "عميل"}
                      </span>
                      <Badge variant={tone === "warning" ? "secondary" : tone === "destructive" ? "destructive" : "outline"}>
                        {next?.title ?? effective}
                      </Badge>
                    </div>
                    <div className="truncate text-sm text-muted-foreground">
                      {first ? `${first.from_location} → ${first.to_location}` : ""}
                      {selling > 0 && paid < selling ? (
                        <span className="mr-2 text-amber-600">
                          متبقي: {(selling - paid).toLocaleString("ar-EG-u-nu-latn")} ج.م
                        </span>
                      ) : null}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      آخر تحديث: {timeAgo(b.updated_at)}
                    </div>
                  </div>
                  <Link href={`/bookings/${b.id}`}>
                    <Button size="sm">متابعة</Button>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
