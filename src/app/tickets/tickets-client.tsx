"use client";

import { useState, useRef, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TicketStatusBadge, EGPAmount } from "@/components/status-badges";
import {
  createTicket,
  issueTicket,
  cancelTicket,
} from "./actions";
import { Plus, Search, Ticket, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { ticket_status_enum } from "@prisma/client";

interface BookingInfo {
  id: bigint;
  booking_reference: string | null;
  customer: {
    id: bigint;
    name: string;
  };
}

interface AirlineInfo {
  id: bigint;
  name: string;
  code: string | null;
}

interface TicketPassenger {
  passenger: {
    id: bigint;
    name: string;
  };
}

interface TicketData {
  id: bigint;
  booking_id: bigint;
  airline_id: bigint;
  ticket_number: string | null;
  pnr: string | null;
  ticket_price: any;
  currency: string;
  issue_date: Date | null;
  status: ticket_status_enum;
  notes: string | null;
  booking: BookingInfo;
  airline: AirlineInfo;
  ticket_passengers: TicketPassenger[];
}

interface BookingOption {
  id: bigint;
  booking_reference: string | null;
}

interface PassengerOption {
  id: bigint;
  name: string;
  booking_id: bigint;
}

const statusFilters: { value: string; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "pending", label: "قيد الانتظار" },
  { value: "issued", label: "تم الإصدار" },
  { value: "modified", label: "تم التعديل" },
  { value: "cancelled", label: "ملغية" },
  { value: "refund_pending", label: "بانتظار الاسترداد" },
  { value: "partially_refunded", label: "استرداد جزئي" },
  { value: "refunded", label: "مستردة" },
];

function formatDate(date: Date | string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("ar-EG-u-nu-latn", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function TicketsClient({
  tickets,
  airlines,
  bookings,
}: {
  tickets: TicketData[];
  airlines: AirlineInfo[];
  bookings: BookingOption[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedBooking, setSelectedBooking] = useState<string>("");
  const [selectedAirline, setSelectedAirline] = useState<string>("");
  const [passengerList, setPassengerList] = useState<PassengerOption[]>([]);
  const [selectedPassengers, setSelectedPassengers] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const filtered = tickets.filter(
    (t) =>
      (statusFilter === "all" || t.status === statusFilter) &&
      (!search ||
        (t.ticket_number && t.ticket_number.includes(search)) ||
        (t.pnr && t.pnr.includes(search)) ||
        t.booking.customer.name.includes(search))
  );

  async function handleBookingChange(bookingId: string) {
    setSelectedBooking(bookingId);
    setSelectedPassengers([]);
    if (!bookingId) {
      setPassengerList([]);
      return;
    }
    try {
      const res = await fetch(
        `/api/passengers?booking_id=${bookingId}`
      );
      if (res.ok) {
        const data = await res.json();
        setPassengerList(data);
      }
    } catch {
      setPassengerList([]);
    }
  }

  function togglePassenger(id: string) {
    setSelectedPassengers((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  async function handleSubmit(formData: FormData) {
    if (!selectedBooking) {
      toast.error("خطأ", { description: "يجب اختيار حجز" });
      return;
    }
    if (!selectedAirline) {
      toast.error("خطأ", { description: "يجب اختيار شركة الطيران" });
      return;
    }
    formData.set("booking_id", selectedBooking);
    formData.set("airline_id", selectedAirline);
    selectedPassengers.forEach((pid) => {
      formData.append("passenger_ids", pid);
    });

    setSubmitting(true);
    try {
      await createTicket(formData);
      toast.success("تمت الإضافة", {
        description: "تم إنشاء التذكرة بنجاح",
      });
      setOpen(false);
      formRef.current?.reset();
      setSelectedBooking("");
      setSelectedAirline("");
      setSelectedPassengers([]);
      setPassengerList([]);
    } catch (e: any) {
      toast.error("خطأ", {
        description: e.message || "حدث خطأ أثناء الإنشاء",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleIssue(id: bigint) {
    if (!confirm("هل أنت متأكد من إصدار هذه التذكرة؟")) return;
    startTransition(async () => {
      try {
        await issueTicket(id);
        toast.success("تم الإصدار", {
          description: "تم إصدار التذكرة بنجاح",
        });
      } catch (e: any) {
        toast.error("خطأ", {
          description: e.message || "حدث خطأ أثناء الإصدار",
        });
      }
    });
  }

  function handleCancel(id: bigint) {
    if (!confirm("هل أنت متأكد من إلغاء هذه التذكرة؟")) return;
    startTransition(async () => {
      try {
        await cancelTicket(id);
        toast.success("تم الإلغاء", {
          description: "تم إلغاء التذكرة بنجاح",
        });
      } catch (e: any) {
        toast.error("خطأ", {
          description: e.message || "حدث خطأ أثناء الإلغاء",
        });
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">التذاكر</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="ml-2 h-4 w-4" />
            إضافة تذكرة
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة تذكرة جديدة</DialogTitle>
              <DialogDescription>
                أدخل بيانات التذكرة الجديدة. الحقول المؤشرة بـ * مطلوبة.
              </DialogDescription>
            </DialogHeader>
            <form ref={formRef} action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>
                  الحجز <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedBooking}
                  onValueChange={(v) => handleBookingChange(v ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر الحجز" />
                  </SelectTrigger>
                  <SelectContent>
                    {bookings.map((b) => (
                      <SelectItem key={String(b.id)} value={String(b.id)}>
                        #{String(b.id)}{" "}
                        {b.booking_reference ? `- ${b.booking_reference}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  شركة الطيران <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedAirline}
                  onValueChange={(v) => setSelectedAirline(v ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر شركة الطيران" />
                  </SelectTrigger>
                  <SelectContent>
                    {airlines.map((a) => (
                      <SelectItem key={String(a.id)} value={String(a.id)}>
                        {a.name} {a.code ? `(${a.code})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticket_number">رقم التذكرة</Label>
                <Input
                  id="ticket_number"
                  name="ticket_number"
                  placeholder="رقم التذكرة"
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pnr">PNR</Label>
                <Input
                  id="pnr"
                  name="pnr"
                  placeholder="رمز الحجز"
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticket_price">سعر التذكرة (ج.م)</Label>
                <Input
                  id="ticket_price"
                  name="ticket_price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  dir="ltr"
                  className="text-left"
                />
              </div>
              {passengerList.length > 0 && (
                <div className="space-y-2">
                  <Label>المسافرين المرتبطين</Label>
                  <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                    {passengerList.map((p) => (
                      <label
                        key={String(p.id)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPassengers.includes(String(p.id))}
                          onChange={() => togglePassenger(String(p.id))}
                          className="rounded"
                        />
                        <span className="text-sm">{p.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="أي ملاحظات إضافية..."
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "جاري الإنشاء..." : "إنشاء التذكرة"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="بحث برقم التذكرة أو PNR أو اسم العميل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((sf) => (
            <Button
              key={sf.value}
              variant={statusFilter === sf.value ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(sf.value)}
            >
              {sf.label}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">#</TableHead>
                  <TableHead className="text-right">رقم التذكرة</TableHead>
                  <TableHead className="text-right">PNR</TableHead>
                  <TableHead className="text-right">اسم العميل</TableHead>
                  <TableHead className="text-right">رقم الحجز</TableHead>
                  <TableHead className="text-right">شركة الطيران</TableHead>
                  <TableHead className="text-right">السعر</TableHead>
                  <TableHead className="text-right">تاريخ الإصدار</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-8 text-muted-foreground"
                    >
                      <Ticket className="mx-auto mb-2 h-8 w-8 opacity-50" />
                      لا توجد تذاكر
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">
                        {String(ticket.id)}
                      </TableCell>
                      <TableCell dir="ltr" className="text-left font-medium">
                        {ticket.ticket_number || "—"}
                      </TableCell>
                      <TableCell dir="ltr" className="text-left">
                        {ticket.pnr || "—"}
                      </TableCell>
                      <TableCell>{ticket.booking.customer.name}</TableCell>
                      <TableCell>
                        <span className="num-ltr">
                          {String(ticket.booking_id)}
                          {ticket.booking.booking_reference
                            ? ` (${ticket.booking.booking_reference})`
                            : ""}
                        </span>
                      </TableCell>
                      <TableCell>
                        {ticket.airline.name}
                        {ticket.airline.code
                          ? ` (${ticket.airline.code})`
                          : ""}
                      </TableCell>
                      <TableCell>
                        <EGPAmount amount={ticket.ticket_price} />
                      </TableCell>
                      <TableCell>
                        {formatDate(ticket.issue_date)}
                      </TableCell>
                      <TableCell>
                        <TicketStatusBadge status={ticket.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {ticket.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleIssue(ticket.id)}
                                disabled={isPending}
                                title="إصدار التذكرة"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCancel(ticket.id)}
                                disabled={isPending}
                                title="إلغاء التذكرة"
                              >
                                <XCircle className="h-4 w-4 text-destructive" />
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
    </div>
  );
}
