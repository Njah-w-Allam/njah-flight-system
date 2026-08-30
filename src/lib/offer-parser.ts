// Local, dependency-free parser that extracts offer fields from free-form text
// pasted by a user (e.g. a WhatsApp message from an execution company).
// It never requires an API key. Fuzzy matching is deliberately lenient so that
// missing/informally-typed data degrades gracefully.

export interface ParsedOffer {
  airline?: string; // best-effort airline name guess
  airlineCode?: string; // e.g. SV from "الخطوط السعودية (SV)" or "SV306"
  executionCost?: number;
  offerType?: "economy" | "business" | "other";
  flightDetails?: string;
  ticketingDeadline?: string; // ISO datetime-local value
  paymentDeadline?: string; // ISO datetime-local value
  confidence: number; // 0..1 heuristic confidence that at least cost was found
}

// Match a number that is clearly an amount: optional thousands separators,
// optional decimal point, preceded/followed by currency-ish context.
const AMOUNT_RE =
  /(?<![A-Za-z0-9])(?:([A-Za-z]{0,4})\s*)?(\d[\d,.]*)\s*(?:ج\.م|ج م|جنيه|EGP|USD|\$|ريال|SAR)/i;

// Airline dictionary: Arabic/common names -> canonical + IATA code.
const AIRLINES: Array<{ keys: RegExp[]; name: string; code?: string }> = [
  { keys: [/السعودية/i, /saudi/i, /saudia/i], name: "الخطوط السعودية", code: "SV" },
  { keys: [/مصر للطيران/i, /egypt ?air/i, /msr/i], name: "مصر للطيران", code: "MS" },
  { keys: [/طيران الإمارات/i, /emirates/i, /طيران الامارات/i], name: "طيران الإمارات", code: "EK" },
  { keys: [/الاتحاد/i, /etihad/i], name: "الاتحاد للطيران", code: "EY" },
  { keys: [/القطرية/i, /قطر/i, /qatar ?air/i], name: "الخطوط الجوية القطرية", code: "QR" },
  { keys: [/العربية/i, /air ?arabia/i], name: "العربية للطيران", code: "G9" },
  { keys: [/الجزيرة/i, /jazeera/i], name: "طيران الجزيرة", code: "J9" },
  { keys: [/العُمانية|العمانية/i, /oman/i], name: "الطيران العماني", code: "WY" },
  { keys: [/الكويتية/i, /kuwait/i], name: "الخطوط الجوية الكويتية", code: "KU" },
  { keys: [/الخطوط الملكية/i, /royal ?jordanian/i], name: "الملكية الأردنية", code: "RJ" },
  { keys: [/النيل|air ?nile/i], name: "النيل للطيران", code: "NP" },
];

function normalizeForLoopup(s: string): string {
  // Collapse Arabic tatweel, diacritics and repeated spaces for fuzzy matching.
  return s.normalize("NFKC").replace(/[\u0640\u064B-\u0652\s]/g, " ").replace(/\s+/g, " ").trim();
}

function parseAmount(text: string): number | undefined {
  const m = text.match(AMOUNT_RE);
  if (!m) return undefined;
  const digits = m[2].replace(/,/g, "");
  const value = Number(digits);
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return value;
}

function findAirline(text: string): ParsedOffer["airline"] | undefined {
  const normalized = normalizeForLoopup(text);
  for (const a of AIRLINES) {
    for (const re of a.keys) {
      if (re.test(normalized)) return a.name;
    }
  }
  return undefined;
}

function findAirlineCode(text: string): string | undefined {
  // A 2-letter IATA code often appears in flight numbers like "SV306".
  const m = text.match(/\b([A-Z]{2})\s?\d{2,4}\b/);
  return m ? m[1] : undefined;
}

function findOfferType(text: string): ParsedOffer["offerType"] {
  const normalized = normalizeForLoopup(text);
  if (/اقتصادي|اقتصادية|economy/i.test(normalized)) return "economy";
  if (/بيزنيس|بيزنس|بزنس|business/i.test(normalized)) return "business";
  return "other";
}

function findFlightDetails(text: string): string | undefined {
  const normalized = normalizeForLoopup(text);
  // Capture a compact route fragment, e.g. "القاهرة → جدة" / "Cairo - Jeddah".
  const route = normalized.match(/(?:^|\s)([^\s,]+)\s*(?:→|->|➝|➞|—-|—)\s*([^\s,]+)/);
  return route ? `${route[1]} → ${route[2]}` : undefined;
}

// Parse a deadline mention like "الإصدار: 27/09/2026 20:00" or
// "يجب الإصدار قبل 27 سبتمبر 2026". Returns an ISO datetime-local string.
function findDeadline(text: string): string | undefined {
  const normalized = normalizeForLoopup(text);
  // dd/mm/yyyy [hh:mm]
  const dmy = normalized.match(
    /\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})[^\n]{0,20}?(\d{1,2}):(\d{2})\b/
  );
  if (dmy) {
    const [, d, mo, y, h, mi] = dmy.map(Number);
    const year = y < 100 ? 2000 + y : y;
    return `${year}-${pad2(mo)}-${pad2(d)}T${pad2(h || 0)}:${pad2(mi)}`;
  }
  // ISO / rtl-safe numeric fallback yyyy-mm-dd
  const iso = normalized.match(/\b(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (iso) {
    const [, y, mo, d, h, mi] = iso;
    return `${y}-${mo}-${d}T${h}:${mi}`;
  }
  return undefined;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function parseOfferText(rawText: string): ParsedOffer {
  const text = rawText.trim();
  const airline = findAirline(text);
  const airlineCodeFromDict = airline ? undefined : findAirlineCode(text);
  const executionCost = parseAmount(text);
  const offerType = findOfferType(text);
  const flightDetails = findFlightDetails(text);

  let ticketingDeadline: string | undefined;
  let paymentDeadline: string | undefined;
  const normalized = normalizeForLoopup(text);
  const issueIdx = normalized.search(/إصدار|تصديد|issue|ticket/);
  const payIdx = normalized.search(/دفع|سداد|payment/);
  if (issueIdx !== -1 || payIdx !== -1) {
    const allDeadlines = Array.from(text.matchAll(/[\d/:\-\s]{6,}/g)).map((m) => m[0]);
    if (issueIdx !== -1 && payIdx !== -1) {
      if (issueIdx < payIdx) {
        ticketingDeadline = findDeadline(text);
        paymentDeadline = allDeadlines.length > 1 ? findDeadline(text.split(/دفع|سداد/)[1] || text) : undefined;
      } else {
        paymentDeadline = findDeadline(text);
        ticketingDeadline = allDeadlines.length > 1 ? findDeadline(text.split(/إصدار/)[1] || text) : undefined;
      }
    } else if (issueIdx !== -1) {
      ticketingDeadline = findDeadline(text);
    } else {
      paymentDeadline = findDeadline(text);
    }
  } else {
    const d = findDeadline(text);
    if (d) ticketingDeadline = d;
  }

  return {
    airline,
    airlineCode: airline ? airlineCodeFromDict : findAirlineCode(text),
    executionCost,
    offerType: offerType === "other" ? undefined : offerType,
    flightDetails,
    ticketingDeadline,
    paymentDeadline,
    confidence: executionCost ? 0.9 : 0.3,
  };
}
