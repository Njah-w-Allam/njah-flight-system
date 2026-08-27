"use client";

import { useState, useRef, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { TicketStatusBadge } from "@/components/status-badges";
import { createPassenger, deletePassenger } from "./actions";
import { Plus, Search, UserCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface TicketRelation {
  ticket: {
    id: bigint;
    ticket_number: string | null;
    status: string;
  };
}

interface Passenger {
  id: bigint;
  booking_id: bigint;
  name: string;
  passport_number: string | null;
  nationality: string | null;
  date_of_birth: Date | null;
  notes: string | null;
  booking: {
    id: bigint;
    booking_reference: string | null;
  };
  ticket_passengers: TicketRelation[];
}

interface BookingOption {
  id: bigint;
  booking_reference: string | null;
}

function formatDate(date: Date | string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function PassengersClient({
  passengers,
  bookings,
}: {
  passengers: Passenger[];
  bookings?: BookingOption[];
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedBooking, setSelectedBooking] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const filtered = passengers.filter(
    (p) =>
      !search ||
      p.name.includes(search) ||
      (p.passport_number && p.passport_number.includes(search))
  );

  async function handleSubmit(formData: FormData) {
    if (!selectedBooking) {
      toast.error("خطأ", { description: "يجب اختيار حجز" });
      return;
    }
    formData.set("booking_id", selectedBooking);
    setSubmitting(true);
    try {
      await createPassenger(formData);
      toast.success("تمت الإضافة", {
        description: "تم إضافة المسافر بنجاح",
      });
      setOpen(false);
      formRef.current?.reset();
      setSelectedBooking("");
    } catch (e: any) {
      toast.error("خطأ", {
        description: e.message || "حدث خطأ أثناء الإضافة",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete(id: bigint) {
    if (!confirm("هل أنت متأكد من حذف هذا المسافر؟")) return;
    startTransition(async () => {
      try {
        await deletePassenger(id);
        toast.success("تم الحذف", { description: "تم حذف المسافر بنجاح" });
      } catch (e: any) {
        toast.error("خطأ", {
          description: e.message || "حدث خطأ أثناء الحذف",
        });
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">المسافرين</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="ml-2 h-4 w-4" />
            إضافة مسافر
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة مسافر جديد</DialogTitle>
              <DialogDescription>
                أدخل بيانات المسافر الجديد. الحقول المؤشرة بـ * مطلوبة.
              </DialogDescription>
            </DialogHeader>
            <form ref={formRef} action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>
                  الحجز <span className="text-destructive">*</span>
                </Label>
                <Select value={selectedBooking} onValueChange={(v) => setSelectedBooking(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر الحجز" />
                  </SelectTrigger>
                  <SelectContent>
                    {bookings?.map((b) => (
                      <SelectItem key={String(b.id)} value={String(b.id)}>
                        #{String(b.id)}{" "}
                        {b.booking_reference ? `- ${b.booking_reference}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">
                  الاسم <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="اسم المسافر"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passport_number">رقم جواز السفر</Label>
                <Input
                  id="passport_number"
                  name="passport_number"
                  placeholder="رقم الجواز"
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality">الجنسية</Label>
                <Input
                  id="nationality"
                  name="nationality"
                  placeholder="الجنسية"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">تاريخ الميلاد</Label>
                <Input id="date_of_birth" name="date_of_birth" type="date" />
              </div>
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
                  {submitting ? "جاري الإضافة..." : "إضافة المسافر"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="بحث بالاسم أو رقم الجواز..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">رقم الجواز</TableHead>
                  <TableHead className="text-right">الجنسية</TableHead>
                  <TableHead className="text-right">تاريخ الميلاد</TableHead>
                  <TableHead className="text-right">رقم الحجز</TableHead>
                  <TableHead className="text-right">التذاكر المرتبطة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      <UserCheck className="mx-auto mb-2 h-8 w-8 opacity-50" />
                      لا يوجد مسافرين
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((passenger) => (
                    <TableRow key={passenger.id}>
                      <TableCell className="font-medium">
                        {String(passenger.id)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {passenger.name}
                      </TableCell>
                      <TableCell dir="ltr" className="text-left">
                        {passenger.passport_number || "—"}
                      </TableCell>
                      <TableCell>{passenger.nationality || "—"}</TableCell>
                      <TableCell>
                        {formatDate(passenger.date_of_birth)}
                      </TableCell>
                      <TableCell>
                        <span className="num-ltr">
                          {String(passenger.booking_id)}
                          {passenger.booking.booking_reference
                            ? ` (${passenger.booking.booking_reference})`
                            : ""}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {passenger.ticket_passengers.length === 0 ? (
                            <span className="text-muted-foreground text-xs">
                              لا توجد
                            </span>
                          ) : (
                            passenger.ticket_passengers.map((tp) => (
                              <Badge key={String(tp.ticket.id)} variant="outline" className="text-xs">
                                {tp.ticket.ticket_number || `#${String(tp.ticket.id)}`}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(passenger.id)}
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
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
