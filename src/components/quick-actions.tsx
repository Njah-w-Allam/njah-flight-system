"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  UserPlus,
  BookOpen,
  Wallet,
  Ticket,
  BadgeDollarSign,
  Loader2,
} from "lucide-react";
import {
  createBookingRequestQuick,
  createCustomerQuick,
  createPaymentQuick,
  createTicketQuick,
  createOfferQuick,
} from "@/app/dashboard/actions";

type ActiveCustomer = { id: bigint; name: string; phone: string };
type Airline = { id: bigint; name: string; code?: string | null };
type Company = { id: bigint; name: string };
type BookingRow = {
  id: bigint;
  booking_reference?: string | null;
  customer?: { name?: string } | null;
};
type RequestRow = {
  id: bigint;
  origin: string;
  destination: string;
  customer?: { name?: string } | null;
};

type QuickAction = "new-booking" | "new-customer" | "payment" | "ticket" | "offer" | null;

export function QuickActions({
  customers,
  airlines,
  companies,
  bookings,
  requests,
}: {
  customers: ActiveCustomer[];
  airlines: Airline[];
  companies: Company[];
  bookings: BookingRow[];
  requests: RequestRow[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState<QuickAction>(null);
  const [pending, startTransition] = useTransition();
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  function handle(act: Exclude<QuickAction, null>) {
    setIsNewCustomer(false);
    setOpen(act);
  }

  function run(
    fn: () => Promise<any>,
    okMsg?: string,
    nav?: string | ((res: any) => string)
  ) {
    startTransition(async () => {
      try {
        const res = await fn();
        if (okMsg) toast.success(okMsg);
        if (nav) {
          router.push(typeof nav === "function" ? nav(res) : nav);
        } else {
          router.refresh();
        }
        setOpen(null);
      } catch (e: any) {
        toast.error("خطأ", { description: e.message || "حدث خطأ" });
      }
    });
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <QuickButton icon={BookOpen} label="+ حجز جديد" onClick={() => handle("new-booking")} primary />
        <QuickButton icon={UserPlus} label="+ إضافة عميل" onClick={() => handle("new-customer")} />
        <QuickButton icon={Wallet} label="+ تسجيل دفعة" onClick={() => handle("payment")} />
        <QuickButton icon={Ticket} label="+ تسجيل تذكرة" onClick={() => handle("ticket")} />
        <QuickButton icon={BadgeDollarSign} label="+ إضافة عرض" onClick={() => handle("offer")} />
      </div>

      {/* New booking modal */}
      <Dialog open={open === "new-booking"} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>حجز جديد</DialogTitle>
            <DialogDescription>
              بيانات أساسية فقط — أكمل باقي التفاصيل لاحقًا من مساحة العمل.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              run(
                () =>
                  createBookingRequestQuick({
                    customer_id: isNewCustomer
                      ? undefined
                      : ((fd.get("customer_id") as string) || undefined),
                    new_customer_name: isNewCustomer
                      ? ((fd.get("new_customer_name") as string) || undefined)
                      : undefined,
                    new_customer_phone: isNewCustomer
                      ? ((fd.get("new_customer_phone") as string) || undefined)
                      : undefined,
                    origin: fd.get("origin") as string,
                    destination: fd.get("destination") as string,
                    depart_date: fd.get("depart_date") as string,
                    passengers_count: Number(fd.get("passengers_count")) || 1,
                    return_date: (fd.get("return_date") as string) || undefined,
                  }),
                "تم إنشاء الطلب",
                (res: any) => `/execution-offers?request=${res.id}`
              );
            }}
            className="space-y-3"
          >
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button type="button" size="sm" variant={isNewCustomer ? "outline" : "default"} onClick={() => setIsNewCustomer(false)}>
                  عميل موجود
                </Button>
                <Button type="button" size="sm" variant={isNewCustomer ? "default" : "outline"} onClick={() => setIsNewCustomer(true)}>
                  عميل جديد
                </Button>
              </div>
              {isNewCustomer ? (
                <div className="grid grid-cols-2 gap-2">
                  <Input name="new_customer_name" placeholder="اسم العميل" required />
                  <Input name="new_customer_phone" placeholder="رقم الهاتف" required dir="ltr" className="text-left" />
                </div>
              ) : (
                <Select name="customer_id" required defaultValue={customers[0] ? String(customers[0].id) : ""}>
                  <SelectTrigger><SelectValue placeholder="اختر العميل..." /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={String(c.id)} value={String(c.id)}>
                        {c.name} - {c.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label>من</Label><Input name="origin" required placeholder="القاهرة" /></div>
              <div className="space-y-1"><Label>إلى</Label><Input name="destination" required placeholder="دبي" /></div>
              <div className="space-y-1"><Label>تاريخ السفر</Label><Input name="depart_date" type="date" required /></div>
              <div className="space-y-1"><Label>عدد المسافرين</Label><Input name="passengers_count" type="number" min={1} defaultValue={1} /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(null)}>إلغاء</Button>
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
                إنشاء الحجز
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* New customer modal */}
      <Dialog open={open === "new-customer"} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة عميل</DialogTitle>
            <DialogDescription>أدخل الاسم ورقم الهاتف.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(
                () => createCustomerQuick(new FormData(e.currentTarget)),
                "تمت إضافة العميل"
              );
            }}
            className="space-y-3"
          >
            <div className="space-y-2">
              <Label>اسم العميل</Label>
              <Input name="name" placeholder="اسم العميل" required />
            </div>
            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input name="phone" placeholder="رقم الهاتف" required dir="ltr" className="text-left" />
            </div>
            <div className="space-y-2">
              <Label>ملاحظات (اختياري)</Label>
              <Textarea name="notes" rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(null)}>إلغاء</Button>
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
                إضافة العميل
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payment modal */}
      <Dialog open={open === "payment"} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تسجيل دفعة</DialogTitle>
            <DialogDescription>سجّل دفعة عميل على حجز.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(() => createPaymentQuick(new FormData(e.currentTarget)), "تم تسجيل الدفعة");
            }}
            className="space-y-3"
          >
            <div className="space-y-2">
              <Label>الحجز</Label>
              <Select name="booking_id" required>
                <SelectTrigger><SelectValue placeholder="اختر الحجز..." /></SelectTrigger>
                <SelectContent>
                  {bookings.map((b) => (
                    <SelectItem key={String(b.id)} value={String(b.id)}>
                      #{String(b.id)}{b.customer?.name ? ` - ${b.customer.name}` : ""}{b.booking_reference ? ` (${b.booking_reference})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>العميل</Label>
                <Select name="customer_id" required>
                  <SelectTrigger><SelectValue placeholder="اختر العميل..." /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={String(c.id)} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>المبلغ (ج.م)</Label>
                <Input name="amount" type="number" step="0.01" min="0.01" required placeholder="0.00" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>طريقة الدفع</Label>
                <Select name="payment_method" required>
                  <SelectTrigger><SelectValue placeholder="اختر الطريقة..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">نقدي</SelectItem>
                    <SelectItem value="instapay">انستاباي</SelectItem>
                    <SelectItem value="vodafone_cash">فودافون كاش</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>ملاحظات (اختياري)</Label>
                <Input name="notes" />
              </div>
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

      {/* Ticket modal */}
      <Dialog open={open === "ticket"} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تسجيل تذكرة</DialogTitle>
            <DialogDescription>أدخل بيانات التذكرة الأساسية.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(() => createTicketQuick(new FormData(e.currentTarget)), "تم تسجيل التذكرة");
            }}
            className="space-y-3"
          >
            <div className="space-y-2">
              <Label>الحجز</Label>
              <Select name="booking_id" required>
                <SelectTrigger><SelectValue placeholder="اختر الحجز..." /></SelectTrigger>
                <SelectContent>
                  {bookings.map((b) => (
                    <SelectItem key={String(b.id)} value={String(b.id)}>
                      #{String(b.id)}{b.customer?.name ? ` - ${b.customer.name}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>شركة الطيران</Label>
              <Select name="airline_id" required>
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
              <div className="space-y-2"><Label>رقم التذكرة</Label><Input name="ticket_number" /></div>
              <div className="space-y-2"><Label>PNR</Label><Input name="pnr" /></div>
              <div className="space-y-2"><Label>السعر (ج.م)</Label><Input name="ticket_price" type="number" step="0.01" min="0" /></div>
            </div>
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

      {/* Offer modal */}
      <Dialog open={open === "offer"} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة عرض تنفيذ</DialogTitle>
            <DialogDescription>سجّل عرضًا واردًا من شركة تنفيذ.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(() => createOfferQuick(new FormData(e.currentTarget)), "تمت إضافة العرض");
            }}
            className="space-y-3"
          >
            <div className="space-y-2">
              <Label>الطلب</Label>
              <Select name="request_id" required>
                <SelectTrigger><SelectValue placeholder="اختر الطلب..." /></SelectTrigger>
                <SelectContent>
                  {requests.map((r) => (
                    <SelectItem key={String(r.id)} value={String(r.id)}>
                      #{String(r.id)} - {r.customer?.name ?? ""} - {r.origin} → {r.destination}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>شركة التنفيذ</Label>
              <Select name="execution_company_id" required>
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
              <Select name="airline_id" required>
                <SelectTrigger><SelectValue placeholder="اختر الناقل..." /></SelectTrigger>
                <SelectContent>
                  {airlines.map((a) => (
                    <SelectItem key={String(a.id)} value={String(a.id)}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>السعر (ج.م)</Label>
              <Input name="execution_cost" type="number" step="0.01" min="0.01" required placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>ملاحظات (اختياري)</Label>
              <Input name="notes" />
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

function QuickButton({
  icon: Icon,
  label,
  onClick,
  primary,
}: {
  icon: any;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <Button
      variant={primary ? "default" : "outline"}
      onClick={onClick}
      className="flex h-24 flex-col items-center justify-center gap-2 text-sm font-medium"
    >
      <Icon className="h-6 w-6" />
      {label}
    </Button>
  );
}
