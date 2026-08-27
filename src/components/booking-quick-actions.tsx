"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Wallet, Ticket, BadgeDollarSign, Loader2 } from "lucide-react";
import { createCustomerPayment } from "@/app/customer-payments/actions";
import { createTicket } from "@/app/tickets/actions";
import { createExecutionOffer } from "@/app/execution-offers/actions";

type Airline = { id: bigint; name: string; code?: string | null };
type Company = { id: bigint; name: string };

type QuickAction = "payment" | "ticket" | "offer" | null;

export function BookingQuickActions({
  booking,
  airlines,
  companies,
}: {
  booking: any;
  airlines: Airline[];
  companies: Company[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState<QuickAction>(null);
  const [pending, startTransition] = useTransition();
  const bookingId = String(booking.id);
  const customerId = String(booking.customer?.id ?? "");
  const requestId = booking.request_id ? String(booking.request_id) : null;
  const execCompanyId = booking.execution_company?.id ? String(booking.execution_company.id) : null;
  const selectedOfferAirline = booking.selected_offer?.airline?.id ? String(booking.selected_offer.airline.id) : "";
  const passengers = booking.passengers || [];

  async function submit(form: HTMLFormElement, fn: (fd: FormData) => Promise<any>) {
    startTransition(async () => {
      try {
        await fn(new FormData(form));
        toast.success("تم الحفظ");
        form.reset();
        setOpen(null);
        router.refresh();
      } catch (e: any) {
        toast.error("خطأ", { description: e.message || "حدث خطأ" });
      }
    });
  }

  function submitOffer(form: HTMLFormElement) {
    const fd = new FormData(form);
    startTransition(async () => {
      try {
        await createExecutionOffer({
          request_id: requestId ?? (fd.get("request_id") as string),
          execution_company_id: (fd.get("execution_company_id") as string) || execCompanyId || "",
          airline_id: (fd.get("airline_id") as string) || "",
          offer_type: (fd.get("offer_type") as string) || "economy",
          execution_cost: Number(fd.get("execution_cost")) || 0,
          flight_details: (fd.get("flight_details") as string) || undefined,
          ticketing_deadline: (fd.get("ticketing_deadline") as string) || undefined,
          payment_deadline: (fd.get("payment_deadline") as string) || undefined,
          notes: (fd.get("notes") as string) || undefined,
        });
        toast.success("تمت إضافة العرض");
        form.reset();
        setOpen(null);
        router.refresh();
      } catch (e: any) {
        toast.error("خطأ", { description: e.message || "حدث خطأ" });
      }
    });
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Button onClick={() => setOpen("payment")} variant="outline" className="h-16 flex-col gap-1">
          <Wallet className="h-5 w-5 text-emerald-600" />
          <span className="text-sm">تسجيل دفعة</span>
        </Button>
        <Button onClick={() => setOpen("ticket")} variant="outline" className="h-16 flex-col gap-1">
          <Ticket className="h-5 w-5 text-primary" />
          <span className="text-sm">تسجيل تذكرة</span>
        </Button>
        <Button onClick={() => setOpen("offer")} variant="outline" className="h-16 flex-col gap-1">
          <BadgeDollarSign className="h-5 w-5 text-amber-600" />
          <span className="text-sm">إضافة عرض</span>
        </Button>
      </div>

      {/* Payment */}
      <Dialog open={open === "payment"} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تسجيل دفعة</DialogTitle>
            <DialogDescription>
              {booking.customer?.name} — حجز #{bookingId}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              fd.set("booking_id", bookingId);
              fd.set("customer_id", customerId);
              submit(e.currentTarget, createCustomerPayment);
            }}
            className="space-y-3"
          >
            <div className="space-y-2">
              <Label>المبلغ (ج.م)</Label>
              <Input name="amount" type="number" step="0.01" min="0.01" required placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>طريقة الدفع</Label>
              <Select name="payment_method" required>
                <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">نقدي</SelectItem>
                  <SelectItem value="instapay">انستاباي</SelectItem>
                  <SelectItem value="vodafone_cash">فودافون كاش</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ملاحظات (اختياري)</Label>
              <Input name="notes" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(null)}>إلغاء</Button>
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
                تسجيل الدفعة
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ticket */}
      <Dialog open={open === "ticket"} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تسجيل تذكرة</DialogTitle>
            <DialogDescription>حجز #{bookingId}</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              fd.set("booking_id", bookingId);
              submit(e.currentTarget, createTicket);
            }}
            className="space-y-3"
          >
            <div className="space-y-2">
              <Label>شركة الطيران</Label>
              <Select name="airline_id" required defaultValue={selectedOfferAirline || undefined}>
                <SelectTrigger><SelectValue placeholder="اختر الناقل..." /></SelectTrigger>
                <SelectContent>
                  {airlines.map((a) => (
                    <SelectItem key={String(a.id)} value={String(a.id)}>
                      {a.name}{a.code ? ` (${a.code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2"><Label>رقم التذكرة</Label><Input name="ticket_number" dir="ltr" className="text-left" /></div>
              <div className="space-y-2"><Label>PNR</Label><Input name="pnr" dir="ltr" className="text-left" /></div>
              <div className="space-y-2"><Label>السعر (ج.م)</Label><Input name="ticket_price" type="number" step="0.01" min="0" /></div>
            </div>
            {passengers.length > 0 && (
              <div className="space-y-2">
                <Label>المسافرين</Label>
                <Select name="passenger_ids">
                  <SelectTrigger><SelectValue placeholder="اختر المسافر (اختياري)..." /></SelectTrigger>
                  <SelectContent>
                    {passengers.map((p: any) => (
                      <SelectItem key={String(p.id)} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(null)}>إلغاء</Button>
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
                تسجيل التذكرة
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Offer */}
      <Dialog open={open === "offer"} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة عرض تنفيذ</DialogTitle>
            <DialogDescription>سجّل عرضًا واردًا لهذا الحجز.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitOffer(e.currentTarget);
            }}
            className="space-y-3"
          >
            <div className="space-y-2">
              <Label>شركة التنفيذ</Label>
              <Select name="execution_company_id" required defaultValue={execCompanyId || undefined}>
                <SelectTrigger><SelectValue placeholder="اختر الشركة..." /></SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={String(c.id)} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الناقل</Label>
              <Select name="airline_id" required defaultValue={selectedOfferAirline || undefined}>
                <SelectTrigger><SelectValue placeholder="اختر الناقل..." /></SelectTrigger>
                <SelectContent>
                  {airlines.map((a) => (
                    <SelectItem key={String(a.id)} value={String(a.id)}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2"><Label>السعر (ج.م)</Label><Input name="execution_cost" type="number" step="0.01" min="0.01" required placeholder="0.00" /></div>
              <div className="space-y-2"><Label>نوع العرض</Label>
                <Select name="offer_type" defaultValue="economy">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="economy">اقتصادي</SelectItem>
                    <SelectItem value="business">بيزنس</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>موعد الإصدار</Label><Input name="ticketing_deadline" type="datetime-local" /></div>
              <div className="space-y-2"><Label>موعد الدفع</Label><Input name="payment_deadline" type="datetime-local" /></div>
              <div className="space-y-2 col-span-2"><Label>ملاحظات (اختياري)</Label><Input name="notes" /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(null)}>إلغاء</Button>
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
                إضافة العرض
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
