"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  buildBookingRequestMessage,
  buildWhatsAppLink,
  type WhatsAppSource,
} from "@/lib/whatsapp";
import { MessageCircle, Copy, ArrowLeft, Loader2 } from "lucide-react";

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
  const [companyId, setCompanyId] = useState<string>("");
  const [navigating, setNavigating] = useState(false);
  const [flexibleDates, setFlexibleDates] = useState(false);

  const initial = useMemo(() => buildBookingRequestMessage(requestSource), [requestSource]);
  const [message, setMessage] = useState(initial);

  // Keep the editable message in sync when a new booking request is created.
  const [lastSynced, setLastSynced] = useState<string>("");
  const syncKey = String(requestId);
  if (open && syncKey !== lastSynced) {
    setMessage(initial);
    setFlexibleDates(false);
    setLastSynced(syncKey);
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

  const company = companies.find((c) => String(c.id) === companyId);
  const targetPhone = company?.phone ?? null;
  const targetLabel = company ? `شركة ${company.name}` : "شركة التنفيذ";

  const waLink = buildWhatsAppLink(targetPhone, message);
  const canSend = waLink.length > 0;

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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            أرسل الطلب عبر واتساب
          </DialogTitle>
          <DialogDescription>
            تم إنشاء الطلب بنجاح. الرسالة معبأة ببيانات الحجز الذي أدخلته. عند إرسالها عبر واتساب، يبقى كل شيء متوقفًا حتى تعود وتتابع يدويًا.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>شركة التنفيذ المستهدفة</Label>
            <Select value={companyId} onValueChange={(v) => setCompanyId(v ?? "")}>
              <SelectTrigger><SelectValue placeholder="اختر شركة التنفيذ..." /></SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={String(c.id)} value={String(c.id)}>
                    {c.name}{c.phone ? ` - ${c.phone}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={copyMessage}>
              <Copy className="ml-2 h-4 w-4" />
              نسخ الرسالة
            </Button>
            {canSend ? (
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-flex">
                <Button className="bg-green-600 hover:bg-green-700 w-full">
                  <MessageCircle className="ml-2 h-4 w-4" />
                  إرسال عبر واتساب
                </Button>
              </a>
            ) : (
              <Button disabled className="w-full">
                <MessageCircle className="ml-2 h-4 w-4" />
                لا يوجد رقم للشركة
              </Button>
            )}
          </div>
          <Button variant="default" onClick={continueToOffers} disabled={navigating}>
            {navigating ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <ArrowLeft className="ml-2 h-4 w-4" />}
            متابعة إلى مرحلة العرض
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
