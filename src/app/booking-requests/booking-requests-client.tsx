"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { RequestStatusBadge } from "@/components/status-badges";
import { booking_request_status_enum } from "@prisma/client";
import Link from "next/link";
import { Plus, Search, Filter, Eye, FileText } from "lucide-react";

interface BookingRequest {
  id: bigint;
  origin: string;
  destination: string;
  trip_type: "one_way" | "round_trip";
  depart_date: Date;
  return_date: Date | null;
  passengers_count: number;
  status: booking_request_status_enum;
  notes: string | null;
  created_at: Date;
  customer: { id: bigint; name: string; phone: string };
}

const statusFilters: { value: string; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "NEW", label: "جديد" },
  { value: "WAITING_FOR_OFFERS", label: "بانتظار العروض" },
  { value: "OFFER_SELECTED", label: "تم اختيار عرض" },
  { value: "CONVERTED", label: "تم التحويل" },
  { value: "CANCELLED", label: "ملغي" },
];

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("ar-EG-u-nu-latn", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function BookingRequestsClient({
  requests,
}: {
  requests: BookingRequest[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = requests.filter((r) => {
    const matchesSearch =
      !search ||
      r.customer.name.includes(search) ||
      r.customer.phone.includes(search) ||
      r.origin.includes(search) ||
      r.destination.includes(search) ||
      String(r.id).includes(search);

    const matchesStatus =
      statusFilter === "all" || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">طلبات الحجز</h1>
        <Link href="/booking-requests/new">
          <Button>
            <Plus className="ml-2 h-4 w-4" />
            طلب حجز جديد
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { status: "NEW", label: "طلبات جديدة", variant: "text-destructive" },
          {
            status: "WAITING_FOR_OFFERS",
            label: "بانتظار العروض",
            variant: "text-amber-600",
          },
          {
            status: "OFFER_SELECTED",
            label: "تم اختيار عرض",
            variant: "text-primary",
          },
          {
            status: "CONVERTED",
            label: "تم التحويل",
            variant: "text-green-600",
          },
          {
            status: "CANCELLED",
            label: "ملغية",
            variant: "text-muted-foreground",
          },
        ].map(({ status, label, variant }) => {
          const count = requests.filter((r) => r.status === status).length;
          return (
            <div
              key={status}
              className="rounded-lg border bg-card p-3 text-center"
            >
              <div className={`text-2xl font-bold ${variant}`}>{count}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو رقم الهاتف أو المدينة أو الرقم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
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
                  <TableHead className="text-right">من</TableHead>
                  <TableHead className="text-right">إلى</TableHead>
                  <TableHead className="text-right">نوع الرحلة</TableHead>
                  <TableHead className="text-right">تاريخ السفر</TableHead>
                  <TableHead className="text-right">المسافرين</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-8 text-muted-foreground"
                    >
                      لا توجد طلبات حجز
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        {String(request.id)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {request.customer.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {request.customer.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{request.origin}</TableCell>
                      <TableCell>{request.destination}</TableCell>
                      <TableCell>
                        {request.trip_type === "one_way" ? "ذهاب فقط" : "ذهاب وعودة"}
                      </TableCell>
                      <TableCell>{formatDate(request.depart_date)}</TableCell>
                      <TableCell>{request.passengers_count}</TableCell>
                      <TableCell>
                        <RequestStatusBadge status={request.status} />
                      </TableCell>
                      <TableCell>{formatDate(request.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {request.status === "CONVERTED" ? (
                            <Link href={`/bookings?request=${request.id}`}>
                              <Button variant="ghost" size="icon" title="عرض الحجز">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          ) : (
                            <Link href={`/execution-offers?request=${request.id}`}>
                              <Button variant="ghost" size="icon" title="عرض العروض">
                                <FileText className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
