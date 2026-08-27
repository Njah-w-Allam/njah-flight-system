"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookingStatusBadge, EGPAmount } from "@/components/status-badges";
import Link from "next/link";
import { Plus, Search, Filter, Eye } from "lucide-react";
import { booking_status_enum } from "@prisma/client";

interface Booking {
  id: bigint;
  booking_reference: string | null;
  booking_status: booking_status_enum;
  depart_date: Date;
  return_date: Date | null;
  current_purchase_price: any;
  current_selling_price: any;
  current_profit: any;
  currency: string;
  issued_before_payment: boolean;
  notes: string | null;
  created_at: Date;
  customer: { id: bigint; name: string; phone: string };
  execution_company: { id: bigint; name: string };
  selected_offer: { airline: { name: string; code: string | null } } | null;
  tickets: { id: bigint; status: string; ticket_number: string | null }[];
  flight_segments: {
    from_location: string;
    to_location: string;
    departure_at: Date;
    flight_number: string | null;
  }[];
}

const statusFilters: { value: string; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "NEW", label: "جديد" },
  { value: "WAITING_PAYMENT", label: "بانتظار الدفع" },
  { value: "WAITING_TICKETING", label: "بانتظار الإصدار" },
  { value: "TICKETED", label: "تم الإصدار" },
  { value: "COMPLETED", label: "مكتمل" },
  { value: "CANCELLED", label: "ملغي" },
  { value: "AT_RISK", label: "تحت المخاطرة" },
];

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("ar-EG-u-nu-latn", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function BookingsClient({ bookings }: { bookings: Booking[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = bookings.filter((b) => {
    const matchesSearch =
      !search ||
      b.customer.name.includes(search) ||
      b.customer.phone.includes(search) ||
      (b.booking_reference && b.booking_reference.includes(search)) ||
      String(b.id).includes(search);

    const matchesStatus =
      statusFilter === "all" || b.booking_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">الحجوزات</h1>
        <Link href="/booking-requests">
          <Button>
            <Plus className="ml-2 h-4 w-4" />
            طلب حجز جديد
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو رقم الهاتف أو رقم الحجز..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-[200px]">
            <Filter className="ml-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusFilters.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                  <TableHead className="text-right">شركة التنفيذ</TableHead>
                  <TableHead className="text-right">الناقل</TableHead>
                  <TableHead className="text-right">تاريخ السفر</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">سعر الشراء</TableHead>
                  <TableHead className="text-right">سعر البيع</TableHead>
                  <TableHead className="text-right">الربح</TableHead>
                  <TableHead className="text-right">التذاكر</TableHead>
                  <TableHead className="text-right">تفاصيل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                      لا توجد حجوزات
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((booking) => {
                    const firstSegment = booking.flight_segments[0];
                    const lastSegment = booking.flight_segments[booking.flight_segments.length - 1];
                    return (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">{String(booking.id)}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{booking.customer.name}</div>
                            <div className="text-xs text-muted-foreground">{booking.customer.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {firstSegment && (
                            <span>
                              {firstSegment.from_location}
                              {lastSegment && lastSegment !== firstSegment
                                ? ` → ${lastSegment.to_location}`
                                : ""}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{booking.execution_company.name}</TableCell>
                        <TableCell>{booking.selected_offer?.airline.name ?? "—"}</TableCell>
                        <TableCell>{formatDate(booking.depart_date)}</TableCell>
                        <TableCell>
                          <BookingStatusBadge status={booking.booking_status} />
                        </TableCell>
                        <TableCell>
                          <EGPAmount amount={booking.current_purchase_price} />
                        </TableCell>
                        <TableCell>
                          <EGPAmount amount={booking.current_selling_price} />
                        </TableCell>
                        <TableCell>
                          <span className={Number(booking.current_profit) >= 0 ? "text-green-600" : "text-destructive"}>
                            <EGPAmount amount={booking.current_profit} />
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {booking.tickets.map((t) => (
                              <Badge key={t.id} variant="outline" className="text-xs">
                                {t.status === "issued" ? "✓" : t.status === "cancelled" ? "✗" : "○"}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link href={`/bookings/${booking.id}`}>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
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
    </div>
  );
}
