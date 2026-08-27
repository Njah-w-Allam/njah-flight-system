// Shared booking lifecycle helpers (Client + Server safe)
//
// These functions derive the employee-facing business signals from a booking:
//   - effectiveStatus  : the lifecycle status, applying the time-based
//                         TICKETED -> COMPLETED transition at read time
//                         (the DB triggers compute data-driven states; time
//                          passing needs the live clock, handled here).
//   - nextAction       : the single most important thing to do now
//   - risk             : cross-cutting "needs attention" conditions
//
// The booking shape matches the serialized booking passed to the client
// (BigInt -> string, Date -> ISO, Decimal -> number).

export type BookingFlowBooking = {
  id: number | string;
  booking_status: string;
  current_selling_price?: number | null;
  issued_before_payment?: boolean;
  risk_reason?: string | null;
  flight_segments?: {
    departure_at?: string | null;
  }[];
  customer_payments?: { amount?: number | null }[];
  tickets?: { status?: string }[];
};

function toMs(date: string | number | Date | null | undefined): number {
  if (date == null) return NaN;
  const t = new Date(date as any).getTime();
  return isNaN(t) ? NaN : t;
}

export function totalPaid(booking: BookingFlowBooking): number {
  return (booking.customer_payments || []).reduce(
    (s, p) => s + Number(p.amount || 0),
    0
  );
}

export function allSegmentsDeparted(booking: BookingFlowBooking, now = Date.now()): boolean {
  const segments = booking.flight_segments || [];
  if (segments.length === 0) return false;
  // Only considers "departed" when every segment's departure has passed.
  const latest = Math.max(
    ...segments.map((s) => toMs(s.departure_at)).filter((t) => !isNaN(t))
  );
  if (!isFinite(latest)) return false;
  return latest <= now;
}

// Effective lifecycle status with the read-time time component applied.
export function effectiveBookingStatus(booking: BookingFlowBooking): string {
  const stored = booking.booking_status;
  // Only upgrade TICKETED -> COMPLETED once the flight has actually departed.
  if (stored === "TICKETED" && allSegmentsDeparted(booking)) {
    return "COMPLETED";
  }
  return stored;
}

export type NextAction = {
  key: string;
  severity: "critical" | "warning" | "info" | "success";
  title: string;
  detail?: string;
  ctaLabel: string;
  ctaHref?: string;
};

export function bookingNeedsAttention(booking: BookingFlowBooking): boolean {
  const paid = totalPaid(booking);
  const selling = Number(booking.current_selling_price || 0);
  const unsettled = booking.issued_before_payment && selling > paid;
  const hasRefundInProgress = (booking.tickets || []).some((t) =>
    ["refund_pending", "partially_refunded"].includes(t.status as string)
  );
  return Boolean(unsettled || hasRefundInProgress || booking.risk_reason);
}

// Derive the primary next action from the booking's state.
// Mirrors the DB derivation so the UI is consistent with stored status.
export function bookingNextAction(
  booking: BookingFlowBooking,
  now = Date.now()
): NextAction | null {
  const status = effectiveBookingStatus(booking);
  const paid = totalPaid(booking);
  const selling = Number(booking.current_selling_price || 0);
  const remaining = Math.max(0, selling - paid);
  const segments = booking.flight_segments || [];
  const pendingTickets = (booking.tickets || []).some((t) => t.status === "pending");
  const unsettled = booking.issued_before_payment && selling > paid;

  switch (status) {
    case "CANCELLED":
      return {
        key: "cancelled",
        severity: "info",
        title: "تم إلغاء الحجز",
        detail: "لا يوجد إجراء مطلوب في الوقت الحالي.",
        ctaLabel: "فتح التفاصيل",
      };
    case "PARTIALLY_CANCELLED":
      return {
        key: "partial-cancelled",
        severity: "warning",
        title: "الحجز ملغي جزئيًا",
        detail: "بعض التذاكر ملغاة. راجع حالة كل تذكرة.",
        ctaLabel: "عرض التذاكر",
      };
    case "COMPLETED":
      return {
        key: "completed",
        severity: "success",
        title: "اكتمل السفر",
        detail: "اكتملت رحلة هذا الحجز.",
        ctaLabel: "فتح الحجز",
      };
    case "MODIFIED":
      return {
        key: "modified",
        severity: "info",
        title: "تم تعديل الحجز",
        detail: "راجع بيانات التذاكر المعدلة.",
        ctaLabel: "عرض التذاكر",
      };
    case "TICKETED":
      if (unsettled) {
        return {
          key: "gather-payment",
          severity: "warning",
          title: "مطلوب تحصيل باقي الدفعة",
          detail: `الإصدار تم قبل الدفع الكامل. المتبقي: ${remaining.toLocaleString("ar-EG-u-nu-latn")} ج.م`,
          ctaLabel: "تسجيل دفعة",
        };
      }
      return {
        key: "ticketed",
        severity: "info",
        title: "التذاكر صدرت",
        detail: pendingTickets
          ? "بعض التذاكر ما زالت قيد الانتظار."
          : undefined,
        ctaLabel: "عرض التذاكر",
      };
    case "WAITING_TICKETING": {
      const nearDepart = segments.length > 0 &&
        Math.min(...segments.map((s) => toMs(s.departure_at)).filter((t) => !isNaN(t))) - now <
          48 * 60 * 60 * 1000;
      return {
        key: "issue-ticket",
        severity: nearDepart ? "critical" : "warning",
        title: "مطلوب الآن: إصدار التذكرة",
        detail: nearDepart
          ? "اقترب موعد السفر — يجب إصدار التذاكر اليوم."
          : pendingTickets
            ? "هناك تذاكر قيد الانتظار."
            : undefined,
        ctaLabel: "إصدار التذكرة",
      };
    }
    case "WAITING_PAYMENT":
      return {
        key: "collect-payment",
        severity: selling > 0 && remaining > 0 ? "warning" : "info",
        title: "مطلوب تحصيل دفعة",
        detail:
          remaining > 0
            ? `المتبقي: ${remaining.toLocaleString("ar-EG-u-nu-latn")} ج.م من ${selling.toLocaleString("ar-EG-u-nu-latn")} ج.م`
            : undefined,
        ctaLabel: "تسجيل دفعة",
      };
    case "NEW":
      return {
        key: "confirm",
        severity: "info",
        title: "حجز جديد",
        detail: "أكمل بيانات الحجز والدفع.",
        ctaLabel: "تسجيل دفعة",
      };
    default:
      return {
        key: "none",
        severity: "info",
        title: "لا يوجد إجراء محدد",
        ctaLabel: "فتح الحجز",
      };
  }
}
