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

// Airlines keyed by IATA 2-letter code so that flight numbers like "SV318"
// or "NE170" can be resolved to a carrier even when no Arabic name is printed.
const CODE_TO_AIRLINE: Record<string, string> = {
  SV: "الخطوط السعودية",
  MS: "مصر للطيران",
  EK: "طيران الإمارات",
  EY: "الاتحاد للطيران",
  QR: "الخطوط الجوية القطرية",
  G9: "العربية للطيران",
  J9: "طيران الجزيرة",
  WY: "الطيران العماني",
  KU: "الخطوط الجوية الكويتية",
  RJ: "الملكية الأردنية",
  NP: "النيل للطيران",
  NE: "طيران النيل",
  SM: "العربية للطيران",
  FZ: "فلاي دبي",
  TK: "التركية للطيران",
  LH: "لوفتهانزا",
};

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
  // A 2-letter IATA code often appears in flight numbers like "SV318" or "NE170".
  const m = text.match(/\b([A-Z]{2})\s?\d{2,4}\b/);
  return m ? m[1].toUpperCase() : undefined;
}

const AIRPORT_CODES = new Set([
  "CAI", "JED", "RUH", "DMM", "MED", "ADB", "DXB", "AUH", "DOH", "KWI",
  "AMM", "MCT", "IST", "SAW", "CMN", "TUN", "ALG", "LHR", "CDG", "FRA",
  "BGW", "BKK", "CJB", "HBE", "LXR", "SSH", "HRG", "ASW",
]);

function findRouteFromAirportCodes(text: string): { from: string; to: string } | undefined {
  const codes = text.toUpperCase().match(/\b([A-Z]{3})\b/g) || [];
  const matches = codes.filter((c) => AIRPORT_CODES.has(c));
  if (matches.length >= 2) return { from: matches[0], to: matches[1] };
  return undefined;
}

function findFlightLine(text: string): string | undefined {
  // Agency format: "<CODE> <num> <class> <DDMMM> <from>... <to> <HHMM> <HHMM>"
  const line = text
    .split(/\n+/)
    .map((l) => l.trim())
    .find((l) => /^[A-Z]{2}\s?\d{2,4}/.test(l) && /\b\d{4}\b/.test(l));
  if (!line) return undefined;
  const code = line.match(/^([A-Z]{2})\s?(\d{2,4})/);
  const date = line.match(/\b(\d{1,2})([A-Z]{3})\b/);
  const route = findRouteFromAirportCodes(line);
  const times = line.match(/\b(\d{4})\b/g);
  if (!code) return undefined;
  let out = `${code[1]} ${code[2]}`;
  if (route) out += ` ${route.from}→${route.to}`;
  if (date) out += ` ${date[1]}${date[2].toUpperCase()}`;
  if (times && times.length >= 1) out += ` ${times[0].slice(0, 2)}:${times[0].slice(2)}`;
  return out;
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
  if (route) return `${route[1]} → ${route[2]}`;
  const airport = findRouteFromAirportCodes(text);
  if (airport) return `${airport.from} → ${airport.to}`;
  return findFlightLine(text);
}

const MONTHS_ENG: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
};

// Agency dates like "30AUG" / "08SEP" → "2026-08-30" (best-effort year).
function parseLiteralDate(m: RegExpMatchArray): string | undefined {
  const day = Number(m[1]);
  const month = MONTHS_ENG[m[2].toUpperCase()];
  if (!day || !month) return undefined;
  const year = new Date().getFullYear();
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

// A standalone bare number (no currency word) — typical agency price e.g. "13240".
function findBareCost(text: string): number | undefined {
  const line = text
    .split(/\n+/)
    .map((l) => l.trim())
    .find((l) => /^\d{4,6}(\.\d{1,2})?$/.test(l.replace(/,/g, "")));
  if (!line) return undefined;
  const v = Number(line.replace(/,/g, ""));
  return Number.isFinite(v) && v > 0 ? v : undefined;
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
  const airlineName = findAirline(text);
  const codeFromFlight = findAirlineCode(text);
  const airline = airlineName || (codeFromFlight ? CODE_TO_AIRLINE[codeFromFlight] : undefined);
  const airlineCode = airlineName ? (CODE_TO_AIRLINE[codeFromFlight ?? ""] ? codeFromFlight : undefined) : codeFromFlight;
  const executionCost = parseAmount(text) ?? findBareCost(text);
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
    // No explicit deadline keyword: use an agency-style flight date as the
    // ticketing/deadline date reference (best-effort year, midnight time).
    const literal = text.match(/\b(\d{1,2})([A-Z]{3})\b/);
    const d = literal ? parseLiteralDate(literal) : undefined;
    ticketingDeadline = d ? `${d}T00:00` : findDeadline(text);
  }

  return {
    airline,
    airlineCode,
    executionCost,
    offerType: offerType === "other" ? undefined : offerType,
    flightDetails,
    ticketingDeadline,
    paymentDeadline,
    confidence: executionCost ? 0.9 : 0.3,
  };
}
