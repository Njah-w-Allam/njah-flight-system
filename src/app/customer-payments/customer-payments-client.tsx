"use client";

import { useState } from "react";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaymentStatusBadge, EGPAmount } from "@/components/status-badges";
import { createCustomerPayment } from "./actions";
import { Plus, Search, Filter, CreditCard } from "lucide-react";
import { payment_status_enum, payment_method_enum } from "@prisma/client";
import { toast } from "sonner";

interface Payment {
  id: bigint;
  booking_id: bigint;
  customer_id: bigint;
  amount: any;
  currency: string;
  payment_method: payment_method_enum;
  payment_date: Date;
  status: payment_status_enum;
  notes: string | null;
  created_at: Date;
  customer: { id: bigint; name: string; phone: string };
  booking: { id: bigint; booking_reference: string | null };
}

interface Booking {
  id: bigint;
  booking_reference: string | null;
  customer: { id: bigint; name: string; phone: string };
}

const paymentMethodLabels: Record<payment_method_enum, string> = {
  cash: "نقدي",
  instapay: "إنستاباي",
  vodafone_cash: "فودافون كاش",
};

const statusFilters: { value: string; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "paid", label: "مدفوع" },
  { value: "pending", label: "قيد الانتظار" },
  { value: "partially_paid", label: "مدفوع جزئياً" },
  { value: "overdue", label: "متأخر" },
];

const methodFilters: { value: string; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "cash", label: "نقدي" },
  { value: "instapay", label: "إنستاباي" },
  { value: "vodafone_cash", label: "فودافون كاش" },
];

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CustomerPaymentsClient({
  payments,
  bookings,
}: {
  payments: Payment[];
  bookings: Booking[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedBookingId, setSelectedBookingId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [notes, setNotes] = useState("");

  const filtered = payments.filter((p) => {
    const matchesSearch =
      !search ||
      p.customer.name.includes(search) ||
      p.customer.phone.includes(search) ||
      String(p.id).includes(search) ||
      String(p.booking_id).includes(search);

    const matchesStatus =
      statusFilter === "all" || p.status === statusFilter;

    const matchesMethod =
      methodFilter === "all" || p.payment_method === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  const selectedBooking = bookings.find(
    (b) => String(b.id) === selectedBookingId
  );

  function resetForm() {
    setSelectedBookingId("");
    setAmount("");
    setPaymentMethod("");
    setNotes("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedBookingId) {
      toast.error("خطأ", { description: "يجب اختيار الحجز" });
      return;
    }

    if (!amount || Number(amount) <= 0) {
      toast.error("خطأ", { description: "يجب إدخال مبلغ صحيح" });
      return;
    }

    if (!paymentMethod) {
      toast.error("خطأ", { description: "يجب اختيار طريقة الدفع" });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("booking_id", selectedBookingId);
      formData.set("customer_id", String(selectedBooking!.customer.id));
      formData.set("amount", amount);
      formData.set("payment_method", paymentMethod);
      formData.set("notes", notes);

      await createCustomerPayment(formData);
      toast.success("تمت الإضافة", {
        description: "تم إضافة الدفعة بنجاح",
      });
      resetForm();
      setOpen(false);
    } catch (err: any) {
      toast.error("خطأ", {
        description: err.message || "حدث خطأ أثناء الإضافة",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مدفوعات العملاء</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="ml-2 h-4 w-4" />
          إضافة دفعة
        </Button>
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
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v ?? "all")}
        >
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
        <Select
          value={methodFilter}
          onValueChange={(v) => setMethodFilter(v ?? "all")}
        >
          <SelectTrigger className="w-[200px]">
            <CreditCard className="ml-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {methodFilters.map((f) => (
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
                  <TableHead className="text-right">رقم الحجز</TableHead>
                  <TableHead className="text-right">المبلغ</TableHead>
                  <TableHead className="text-right">طريقة الدفع</TableHead>
                  <TableHead className="text-right">تاريخ الدفع</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">ملاحظات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      لا توجد مدفوعات
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {String(payment.id)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {payment.customer.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {payment.customer.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        #{String(payment.booking_id)}
                        {payment.booking.booking_reference && (
                          <span className="text-xs text-muted-foreground mr-1">
                            ({payment.booking.booking_reference})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <EGPAmount amount={payment.amount} />
                      </TableCell>
                      <TableCell>
                        {paymentMethodLabels[payment.payment_method]}
                      </TableCell>
                      <TableCell>
                        {formatDateTime(payment.payment_date)}
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={payment.status} />
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate text-muted-foreground">
                        {payment.notes || "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة دفعة عميل جديدة</DialogTitle>
            <DialogDescription>
              اختر الحجز وأدخل بيانات الدفع
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>
                الحجز <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedBookingId}
                onValueChange={(v) => setSelectedBookingId(v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر الحجز" />
                </SelectTrigger>
                <SelectContent>
                  {bookings.map((b) => (
                    <SelectItem key={String(b.id)} value={String(b.id)}>
                      #{String(b.id)} - {b.customer.name}
                      {b.booking_reference
                        ? ` (${b.booking_reference})`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedBooking && (
              <div className="rounded-lg border bg-muted/50 p-3 text-sm space-y-1">
                <div className="font-medium">
                  {selectedBooking.customer.name}
                </div>
                <div className="text-muted-foreground">
                  {selectedBooking.customer.phone}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="amount">
                المبلغ (ج.م) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                dir="ltr"
                className="text-left"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>
                طريقة الدفع <span className="text-destructive">*</span>
              </Label>
              <Select
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر طريقة الدفع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">نقدي</SelectItem>
                  <SelectItem value="instapay">إنستاباي</SelectItem>
                  <SelectItem value="vodafone_cash">فودافون كاش</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أي ملاحظات إضافية..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? "جاري الإضافة..." : "إضافة الدفعة"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
