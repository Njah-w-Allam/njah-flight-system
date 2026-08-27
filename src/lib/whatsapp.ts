// WhatsApp request helpers (Client safe).
//
// There is no WhatsApp API in this product. The employee does the real
// work manually: this module builds a professional Arabic request message
// and produces a wa.me link the employee can open (or copy) to send it.
// It never pretends to send or receive messages automatically.

export type WhatsAppSource = {
  customer?: { name?: string; phone?: string } | null;
  execution_company?: { name?: string; phone?: string } | null;
  depart_date?: string | Date | null;
  return_date?: string | Date | null;
  passengers?: unknown[];
  flight_segments?: {
    from_location?: string;
    to_location?: string;
    class?: string | null;
  }[];
  booking_reference?: string | null;
  id?: number | string;
};

function fmtDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("ar-EG-u-nu-latn", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Best-effort conversion of a phone number to the international +country
// format wa.me expects. Egyptian numbers commonly start with 0/01; default
// to Egypt (+20) when the number has no explicit country code.
export function formatPhoneForWhatsApp(phone?: string | null): string {
  if (!phone) return "";
  let digits = phone
    .replace(/[^0-9]/g, "")
    .replace(/^00/, "+")
    .replace(/^\+/, "");
  digits = digits.replace(/^\+/, "");
  if (digits.length === 0) return "";
  let country = "";
  if (digits.startsWith("20")) {
    country = "20";
    digits = digits.slice(2);
  } else if (digits.startsWith("1") || digits.startsWith("01")) {
    country = "20";
    if (digits.startsWith("01")) digits = digits.slice(1);
  } else if (digits.length <= 10) {
    country = "20";
    if (digits.startsWith("01")) digits = digits.slice(1);
  } else {
    country = "";
  }
  return `${country}${digits}`;
}

export function buildBookingRequestMessage(booking: WhatsAppSource): string {
  const customerName = booking.customer?.name?.trim();
  const from = booking.flight_segments?.[0]?.from_location?.trim();
  const to = booking.flight_segments?.[0]?.to_location?.trim();
  const date = fmtDate(booking.depart_date);
  const returnDate = fmtDate(booking.return_date);
  const passengersCount = booking.passengers?.length ?? 0;
  const klass =
    booking.flight_segments?.[0]?.class?.trim() || "Economy";
  const reference = booking.booking_reference ?? `#${booking.id}`;

  const lines: string[] = [];
  lines.push("السلام عليكم ورحمة الله وبركاته،");
  lines.push("");
  lines.push("مطلوب سعر وتوافر للرحلة التالية:");
  lines.push("");
  lines.push(`من: ${from || "—"}`);
  lines.push(`إلى: ${to || "—"}`);
  if (date) lines.push(`تاريخ السفر: ${date}`);
  if (returnDate) lines.push(`تاريخ العودة: ${returnDate}`);
  lines.push(`عدد المسافرين: ${passengersCount || 1}`);
  lines.push(`الدرجة: ${klass}`);
  lines.push("");
  lines.push("برجاء إرسال:");
  lines.push("- السعر");
  lines.push("- موعد الإصدار");
  lines.push("- صلاحية العرض");
  lines.push("- شروط الدفع");
  lines.push("");
  if (customerName) {
    const customerPhone = booking.customer?.phone?.trim();
    lines.push(
      customerPhone
        ? `العميل: ${customerName} (${customerPhone})`
        : `العميل: ${customerName}`
    );
  }
  lines.push(`مرجع الحجز: ${reference}`);
  lines.push("");
  lines.push("شكرًا لتعاونكم.");

  return lines.join("\n");
}

export function buildWhatsAppLink(phone: string | null | undefined, text: string): string {
  const normalized = formatPhoneForWhatsApp(phone);
  if (!normalized) return "";
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}

// Opens WhatsApp and lets the employee choose the contact (no phone required),
// as used when sending a request without targeting a specific company.
export function buildWhatsAppShareLink(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
