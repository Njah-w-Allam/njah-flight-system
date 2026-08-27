"use client";

import { useState, useTransition } from "react";
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
import {
  OfferStatusBadge,
  EGPAmount,
} from "@/components/status-badges";
import { rejectOffer, selectOffer } from "./actions";
import Link from "next/link";
import { Plus, Search, Filter, CheckCircle, XCircle } from "lucide-react";
import { offer_status_enum } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Offer {
  id: string;
  request_id: string;
  execution_company_id: string;
  airline_id: string;
  offer_type: string;
  execution_cost: number;
  currency: string;
  flight_details: string | null;
  ticketing_deadline: string | null;
  payment_deadline: string | null;
  received_at: string | null;
  status: offer_status_enum;
  notes: string | null;
  created_at: string;
  request: {
    id: string;
    origin: string;
    destination: string;
    trip_type: string;
    depart_date: string;
    return_date: string | null;
    passengers_count: number;
    status: string;
    customer: { id: string; name: string; phone: string };
  };
  execution_company: { id: string; name: string };
  airline: { id: string; name: string; code: string | null };
}

const statusFilters: { value: string; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "received", label: "مستلم" },
  { value: "rejected", label: "مرفوض" },
  { value: "expired", label: "منتهي" },
  { value: "cancelled", label: "ملغي" },
];

const offerTypeMap: Record<string, string> = {
  economy: "اقتصادي",
  business: "بيزنس",
  other: "أخرى",
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("ar-EG-u-nu-latn", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("ar-EG-u-nu-latn", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ExecutionOffersClient({ offers }: { offers: Offer[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [requestFilter, setRequestFilter] = useState("all");
  const [isPending, startTransition] = useTransition();
  const [confirmTarget, setConfirmTarget] = useState<{
    offer: Offer;
    action: "select" | "reject";
  } | null>(null);

  const requests = Array.from(
    new Map(
      offers.map((o) => [
        o.request_id,
        {
          id: o.request_id,
          label: `#${o.request_id} - ${o.request.customer.name} - ${o.request.origin} → ${o.request.destination}`,
        },
      ])
    ).values()
  );

  const filtered = offers.filter((o) => {
    const matchesSearch =
      !search ||
      o.request.customer.name.includes(search) ||
      o.execution_company.name.includes(search) ||
      o.airline.name.includes(search) ||
      String(o.id).includes(search);

    const matchesStatus =
      statusFilter === "all" || o.status === statusFilter;

    const matchesRequest =
      requestFilter === "all" || o.request_id === requestFilter;

    return matchesSearch && matchesStatus && matchesRequest;
  });

  function handleReject(offer: Offer) {
    setConfirmTarget({ offer, action: "reject" });
  }

  function handleSelect(offer: Offer) {
    setConfirmTarget({ offer, action: "select" });
  }

  function handleConfirm() {
    if (!confirmTarget) return;
    const { offer, action } = confirmTarget;
    const run =
      action === "select"
        ? () => selectOffer(offer.id)
        : () => rejectOffer(offer.id);
    startTransition(async () => {
      await run();
      setConfirmTarget(null);
    });
  }

  const confirmOffer = confirmTarget?.offer;
  const isSelect = confirmTarget?.action === "select";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">عروض التنفيذ</h1>
        <Link href="/execution-offers/new">
          <Button>
            <Plus className="ml-2 h-4 w-4" />
            إضافة عرض جديد
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو الشركة أو الناقل..."
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
        <Select value={requestFilter} onValueChange={(v) => setRequestFilter(v ?? "all")}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="فلتر حسب الطلب" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الطلبات</SelectItem>
            {requests.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.label}
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
                  <TableHead className="text-right">الطلب</TableHead>
                  <TableHead className="text-right">العميل</TableHead>
                  <TableHead className="text-right">شركة التنفيذ</TableHead>
                  <TableHead className="text-right">الناقل</TableHead>
                  <TableHead className="text-right">نوع العرض</TableHead>
                  <TableHead className="text-right">التكلفة</TableHead>
                  <TableHead className="text-right">موعد الإصدار</TableHead>
                  <TableHead className="text-right">موعد الدفع</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">تاريخ الاستلام</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={12}
                      className="text-center py-8 text-muted-foreground"
                    >
                      لا توجد عروض تنفيذ
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((offer) => (
                    <TableRow key={offer.id}>
                      <TableCell className="font-medium">
                        {offer.id}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            #{offer.request_id}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {offer.request.origin} →{" "}
                            {offer.request.destination}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {offer.request.customer.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {offer.request.customer.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{offer.execution_company.name}</TableCell>
                      <TableCell>
                        {offer.airline.name}
                        {offer.airline.code && (
                          <span className="text-xs text-muted-foreground mr-1">
                            ({offer.airline.code})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {offerTypeMap[offer.offer_type] ?? offer.offer_type}
                      </TableCell>
                      <TableCell>
                        <EGPAmount amount={offer.execution_cost} />
                      </TableCell>
                      <TableCell>
                        {formatDateTime(offer.ticketing_deadline)}
                      </TableCell>
                      <TableCell>
                        {formatDateTime(offer.payment_deadline)}
                      </TableCell>
                      <TableCell>
                        <OfferStatusBadge status={offer.status} />
                      </TableCell>
                      <TableCell>
                        {formatDateTime(offer.received_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {offer.status === "received" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-green-600 hover:text-green-700"
                                disabled={isPending}
                                onClick={() => handleSelect(offer)}
                                title="اختيار العرض"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                disabled={isPending}
                                onClick={() => handleReject(offer)}
                                title="رفض العرض"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
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

      <Dialog
        open={confirmTarget !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isSelect ? "تأكيد اختيار العرض" : "تأكيد رفض العرض"}
            </DialogTitle>
            <DialogDescription>
              {isSelect
                ? "سيتم إنشاء حجز من هذا العرض بسعر التنفيذ التالي، ورفض جميع العروض المنافسة الأخرى. هذا الإجراء نهائي."
                : "سيتم رفض هذا العرض ولن يُستخدم لحجز الرحلة. هذا الإجراء نهائي."}
            </DialogDescription>
          </DialogHeader>
          {confirmOffer && (
            <div className="space-y-2 rounded-lg border bg-muted/40 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">العميل</span>
                <span className="font-medium">
                  {confirmOffer.request.customer.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الرحلة</span>
                <span className="font-medium">
                  {confirmOffer.request.origin} → {confirmOffer.request.destination}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">شركة التنفيذ</span>
                <span className="font-medium">
                  {confirmOffer.execution_company.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">التكلفة</span>
                <span className="font-medium">
                  <EGPAmount amount={confirmOffer.execution_cost} />
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmTarget(null)}
              disabled={isPending}
            >
              إلغاء
            </Button>
            <Button
              variant={isSelect ? "default" : "destructive"}
              onClick={handleConfirm}
              disabled={isPending}
            >
              {isSelect ? "تأكيد الاختيار" : "تأكيد الرفض"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
