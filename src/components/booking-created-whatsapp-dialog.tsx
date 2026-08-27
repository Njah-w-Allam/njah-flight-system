"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  buildBookingRequestMessage,
  buildWhatsAppLink,
  buildWhatsAppShareLink,
  type WhatsAppSource,
} from "@/lib/whatsapp";
import { MessageCircle, Copy, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Company = { id: bigint; name: string; phone?: string | null };

const FLEXIBLE_LINE = "ممكن تشوف يوم قبل او يوم بعد ارخص سعر";

export function BookingWhatsAppDialog({
  open,
  onOpenChange,
  requestSource,
  requestId,
  companies,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestSource: WhatsAppSource;
  requestId: string;
  companies: Company[];
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [navigating, setNavigating] = useState(false);
  const [flexibleDates, setFlexibleDates] = useState(false);

  const initial = useMemo(() => buildBookingRequestMessage(requestSource), [requestSource]);
  const [message, setMessage] = useState(initial);

  // Default to the first company that has a phone number when the dialog opens.
  const defaultIds = useMemo(() => {
    const withPhone = companies.find((c) => c.phone);
    return withPhone ? [String(withPhone.id)] : [];
  }, [companies]);

  // Keep the editable message in sync when a new booking request is created.
  const [lastSynced, setLastSynced] = useState<string>("");
  const syncKey = String(requestId);
  if (open && syncKey !== lastSynced) {
    setMessage(initial);
    setFlexibleDates(false);
    setLastSynced(syncKey);
    setSelectedIds(defaultIds);
  }

  function toggleFlexible(on: boolean) {
    setFlexibleDates(on);
    setMessage((prev) => {
      if (on) {
        return prev.includes(FLEXIBLE_LINE) ? prev : `${prev}\n${FLEXIBLE_LINE}`;
      }
      return prev.split("\n").filter((l) => l.trim() !== FLEXIBLE_LINE).join("\n");
    });
  }

  function toggleCompany(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const sendable = companies.filter(
    (c) => selectedIds.includes(String(c.id)) && c.phone
  );

  function sendToWhatsApp() {
    // If any companies with a phone are selected, open WhatsApp for each one.
    // Otherwise open a WhatsApp share so the employee picks the contact inside
    // WhatsApp (no execution company required).
    if (sendable.length === 0) {
      window.open(buildWhatsAppShareLink(message), "_blank", "noopener,noreferrer");
      return;
    }
    sendable.forEach((c, i) => {
      const link = buildWhatsAppLink(c.phone, message);
      if (!link) return;
      setTimeout(() => window.open(link, "_blank", "noopener,noreferrer"), i * 150);
    });
    if (sendable.length > 1) {
      toast.success(`تم فتح واتساب لـ ${sendable.length} شركات`);
    } else {
      toast.success("تم فتح واتساب");
    }
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      toast.success("تم النسخ", { description: "انسخ الرسالة والصقها في واتساب" });
    } catch {
      toast.error("تعذّر النسخ", { description: "حدد النص وانسخه يدويًا" });
    }
  }

  function continueToOffers() {
    setNavigating(true);
    router.push(`/execution-offers?request=${requestId}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-lg overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            أرسل الطلب عبر واتساب
          </DialogTitle>
          <DialogDescription>
            تم إنشاء الطلب بنجاح. الرسالة معبأة ببيانات الحجز (العميل واسمه ورقمه). أرسلها مباشرة لشركة تنفيذ أو بدون تحديد شركة لاختيار جهة الاتصال من داخل واتساب. يبقى كل شيء متوقفًا حتى تعود وتتابع يدويًا.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>شركات التنفيذ (اختياري — اختر واحدة أو أكثر)</Label>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border p-2">
              {companies.length === 0 ? (
                <p className="px-1 py-2 text-sm text-muted-foreground">لا توجد شركات تنفيذ مسجلة — يمكنك الإرسال مباشرة واختيار جهة الاتصال من داخل واتساب.</p>
              ) : (
                companies.map((c) => {
                  const checked = selectedIds.includes(String(c.id));
                  return (
                    <label
                      key={String(c.id)}
                      className={cn(
                        "flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                        checked ? "bg-primary/10" : "hover:bg-muted"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCompany(String(c.id))}
                          className="h-4 w-4 shrink-0 accent-primary"
                        />
                        <span className="font-medium">{c.name}</span>
                      </span>
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        {c.phone ? (
                          c.phone
                        ) : (
                          <span className="text-destructive">بدون رقم</span>
                        )}
                        {checked && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
            <input
              type="checkbox"
              checked={flexibleDates}
              onChange={(e) => toggleFlexible(e.target.checked)}
              className="h-4 w-4 shrink-0 accent-primary"
            />
            <span className="text-sm text-foreground">ممكن تشوف يوم قبل او يوم بعد ارخص سعر</span>
          </label>

          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={13}
            className="text-sm"
            dir="rtl"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={copyMessage}>
              <Copy className="ml-2 h-4 w-4" />
              نسخ الرسالة
            </Button>
            <Button
              type="button"
              onClick={sendToWhatsApp}
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
            >
              <MessageCircle className="ml-2 h-4 w-4" />
              {sendable.length === 0
                ? "إرسال عبر واتساب (اختر جهة الاتصال)"
                : sendable.length > 1
                  ? `إرسال عبر واتساب (${sendable.length} شركات)`
                  : "إرسال عبر واتساب"}
            </Button>
          </div>
          <Button variant="default" onClick={continueToOffers} disabled={navigating} className="w-full sm:w-auto">
            {navigating ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <ArrowLeft className="ml-2 h-4 w-4" />}
            متابعة إلى مرحلة العرض
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
