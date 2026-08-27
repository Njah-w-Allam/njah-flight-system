"use client";

import { Badge } from "@/components/ui/badge";
import {
  booking_status_enum,
  ticket_status_enum,
  alert_severity_enum,
  payment_status_enum,
  booking_request_status_enum,
  offer_status_enum,
} from "@prisma/client";

const bookingStatusMap: Record<booking_status_enum, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  NEW: { label: "جديد", variant: "secondary" },
  WAITING_PAYMENT: { label: "بانتظار الدفع", variant: "outline" },
  WAITING_TICKETING: { label: "بانتظار الإصدار", variant: "outline" },
  TICKETED: { label: "تم الإصدار", variant: "default" },
  COMPLETED: { label: "مكتمل", variant: "default" },
  CANCELLED: { label: "ملغي", variant: "destructive" },
  PARTIALLY_CANCELLED: { label: "إلغاء جزئي", variant: "destructive" },
  MODIFIED: { label: "تم التعديل", variant: "secondary" },
  AT_RISK: { label: "تحت المخاطرة", variant: "destructive" },
};

const ticketStatusMap: Record<ticket_status_enum, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "قيد الانتظار", variant: "outline" },
  issued: { label: "تم الإصدار", variant: "default" },
  modified: { label: "تم التعديل", variant: "secondary" },
  cancelled: { label: "ملغية", variant: "destructive" },
  refund_pending: { label: "بانتظار الاسترداد", variant: "outline" },
  partially_refunded: { label: "استرداد جزئي", variant: "secondary" },
  refunded: { label: "مستردة", variant: "default" },
};

const severityMap: Record<alert_severity_enum, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  info: { label: "معلومات", variant: "secondary" },
  warning: { label: "تنبيه", variant: "outline" },
  critical: { label: "حرج", variant: "destructive" },
};

const paymentStatusMap: Record<payment_status_enum, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "قيد الانتظار", variant: "outline" },
  partially_paid: { label: "مدفوع جزئياً", variant: "secondary" },
  paid: { label: "مدفوع", variant: "default" },
  overdue: { label: "متأخر", variant: "destructive" },
};

const requestStatusMap: Record<booking_request_status_enum, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  NEW: { label: "جديد", variant: "secondary" },
  WAITING_FOR_OFFERS: { label: "بانتظار العروض", variant: "outline" },
  OFFER_SELECTED: { label: "تم اختيار عرض", variant: "default" },
  CONVERTED: { label: "تم التحويل", variant: "default" },
  CANCELLED: { label: "ملغي", variant: "destructive" },
};

const offerStatusMap: Record<offer_status_enum, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  received: { label: "مستلم", variant: "secondary" },
  rejected: { label: "مرفوض", variant: "destructive" },
  expired: { label: "منتهي", variant: "outline" },
  cancelled: { label: "ملغي", variant: "destructive" },
};

export function BookingStatusBadge({ status }: { status: booking_status_enum }) {
  const config = bookingStatusMap[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function TicketStatusBadge({ status }: { status: ticket_status_enum }) {
  const config = ticketStatusMap[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function SeverityBadge({ severity }: { severity: alert_severity_enum }) {
  const config = severityMap[severity];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: payment_status_enum }) {
  const config = paymentStatusMap[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function RequestStatusBadge({ status }: { status: booking_request_status_enum }) {
  const config = requestStatusMap[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function OfferStatusBadge({ status }: { status: offer_status_enum }) {
  const config = offerStatusMap[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function EGPAmount({ amount }: { amount: number | string }) {
  return (
    <span className="num-ltr">
      {Number(amount).toLocaleString("ar-EG", { minimumFractionDigits: 2 })} ج.م
    </span>
  );
}
