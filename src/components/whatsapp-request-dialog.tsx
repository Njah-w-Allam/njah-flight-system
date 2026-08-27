"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  buildBookingRequestMessage,
  buildWhatsAppLink,
  type WhatsAppSource,
} from "@/lib/whatsapp";
import { MessageCircle, Copy } from "lucide-react";

export function WhatsAppRequestDialog({
  open,
  onOpenChange,
  booking,
  targetLabel,
  targetPhone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: WhatsAppSource;
  targetLabel: string;
  targetPhone?: string | null;
}) {
  const initial = useMemo(
    () => buildBookingRequestMessage(booking),
    [booking]
  );
  const [message, setMessage] = useState(initial);

  // Keep the editable message in sync when the dialog opens with new booking data.
  const [lastSyncedKey, setLastSyncedKey] = useState<string>("");
  const syncKey = JSON.stringify([booking.id, targetPhone]);
  if (open && syncKey !== lastSyncedKey) {
    setMessage(initial);
    setLastSyncedKey(syncKey);
  }

  const waLink = buildWhatsAppLink(targetPhone, message);
  const canSend = waLink.length > 0;

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      toast.success("تم النسخ", {
        description: "انسخ الرسالة والصقها في واتساب",
      });
    } catch {
      toast.error("تعذّر النسخ", {
        description: "حدد النص وانسخه يدويًا",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            إرسال الطلب عبر واتساب
          </DialogTitle>
          <DialogDescription>
            {targetLabel ? `الرسالة التالية جاهزة للإرسال إلى ${targetLabel}.` : "راجع الرسالة ثم أرسلها أو انسخها."}{" "}
            يفتح الاتصال واتساب ولا يُرسل الرسالة تلقائيًا.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={14}
            className="text-sm"
            dir="rtl"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={copyMessage}>
            <Copy className="ml-2 h-4 w-4" />
            نسخ الرسالة
          </Button>
          {canSend ? (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button className="bg-green-600 hover:bg-green-700 w-full">
                <MessageCircle className="ml-2 h-4 w-4" />
                إرسال عبر واتساب
              </Button>
            </a>
          ) : (
            <Button disabled className="w-full">
              <MessageCircle className="ml-2 h-4 w-4" />
              لا يوجد رقم هاتف مسجّل
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
