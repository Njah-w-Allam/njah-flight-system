"use client";

import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { parseOfferText, matchRequestByRoute, routeCities, ParsedOffer } from "@/lib/offer-parser";

export interface AppliedOffer {
  airlineId?: string;
  offerType?: "economy" | "business" | "other";
  executionCost?: string;
  flightDetails?: string;
  ticketingDeadline?: string;
  paymentDeadline?: string;
  notes?: string;
  matchedRequestId?: string; // inferred from the parsed وجهة (route)
}

interface Props {
  airlines: Array<{ id: string; name: string; code: string | null }>;
  requests: Array<{ id: string; origin: string; destination: string }>;
  onApply: (offer: AppliedOffer) => void;
}

interface ReviewRow {
  key: keyof AppliedOffer;
  label: string;
  value: string;
  checked: boolean;
}

// Match a parsed airline name to an existing airline in the select list.
function matchAirline(
  parsed: ParsedOffer,
  airlines: Props["airlines"]
): string | undefined {
  if (!parsed.airline) return undefined;
  const norm = (s: string) => s.replace(/[^\p{L}\p{N}]+/gu, "").toLowerCase();
  const target = norm(parsed.airline);
  const exact = airlines.find((a) => norm(a.name) === target);
  if (exact) return exact.id;
  // Token overlap fallback (e.g. "السعودية" vs "الخطوط السعودية").
  const toks = target.split("");
  const scored = airlines
    .map((a) => ({ a, score: scoreOverlap(target, norm(a.name)) }))
    .sort((x, y) => y.score - x.score);
  return scored[0] && scored[0].score >= 2 ? scored[0].a.id : undefined;
}

function scoreOverlap(a: string, b: string): number {
  let score = 0;
  for (const ch of a) if (b.includes(ch)) score++;
  return score;
}

function buildRows(parsed: ParsedOffer, airlines: Props["airlines"]): ReviewRow[] {
  const rows: ReviewRow[] = [];
  const airlineId = matchAirline(parsed, airlines);
  if (airlineId) rows.push({ key: "airlineId", label: "الناقل", value: parsed.airline!, checked: true });
  else if (parsed.airline) rows.push({ key: "notes", label: "الناقل (غير مسجل)", value: parsed.airline, checked: true });
  if (parsed.offerType) rows.push({ key: "offerType", label: "نوع العرض", value: parsed.offerType, checked: true });
  if (parsed.executionCost !== undefined) rows.push({ key: "executionCost", label: "تكلفة التنفيذ", value: String(parsed.executionCost), checked: true });
  if (parsed.flightDetails) rows.push({ key: "flightDetails", label: "تفاصيل الرحلة", value: parsed.flightDetails, checked: true });
  if (parsed.ticketingDeadline) rows.push({ key: "ticketingDeadline", label: "موعد الإصدار", value: parsed.ticketingDeadline, checked: true });
  if (parsed.paymentDeadline) rows.push({ key: "paymentDeadline", label: "موعد الدفع", value: parsed.paymentDeadline, checked: true });
  return rows;
}

export function FastOfferPanel({ airlines, requests, onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [imageName, setImageName] = useState<string | null>(null);
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ReviewRow[] | null>(null);
  const [unmatchedAirline, setUnmatchedAirline] = useState<string | null>(null);
  const [matchedRequest, setMatchedRequest] = useState<
    | { id: string; label: string }
    | "none"
    | null
  >(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Match a parsed route (وجهة) to a booking request's route so the created
  // offer inherits the correct وجهة. Handles both English airport codes
  // ("CAI → JED") and Arabic city routes ("القاهرة → جدة").
  function matchRequest(route?: string): { id: string; label: string } | undefined {
    const req = matchRequestByRoute(route, requests);
    if (!req) return undefined;
    const cities = routeCities(route);
    return {
      id: req.id,
      label: cities ? `#${req.id} - ${cities.origin} → ${cities.destination}` : `#${req.id}`,
    };
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      setImageB64(dataUrl.split(",")[1] || null);
    };
    reader.readAsDataURL(file);
  }

  async function handleAnalyze() {
    setError(null);
    setRows(null);
    setUnmatchedAirline(null);
    if (!text.trim() && !imageB64) {
      setError("الصق نص العرض أو ارفق صورة أولاً");
      return;
    }
    setBusy(true);
    try {
      let parsed: ParsedOffer;
      try {
        const resp = await fetch("/api/offer-extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, image: imageB64 }),
        });
        const data = await resp.json();
        // Enabled means a configured API key handled it; otherwise use the local parser.
        parsed =
          data?.enabled === true && !data?.error
            ? (data as ParsedOffer)
            : parseOfferText(text);
      } catch {
        parsed = parseOfferText(text);
      }
      const built = buildRows(parsed, airlines);
      setUnmatchedAirline(parsed.airline && !matchAirline(parsed, airlines) ? parsed.airline : null);
      const matched = matchRequest(parsed.destination || parsed.flightDetails || text);
      setMatchedRequest(matched ? matched : (parsed.destination ? "none" : null));
      setRows(built);
      if (!built.length) setError("لم يتم التعرف على أية بيانات قابلة للتعبئة");
    } finally {
      setBusy(false);
    }
  }

  function toggle(key: keyof AppliedOffer) {
    setRows((prev) =>
      prev
        ? prev.map((r) => (Object.is(r.key, key) ? { ...r, checked: !r.checked } : r))
        : prev
    );
  }

  function handleApply() {
    if (!rows) return;
    const applied: AppliedOffer = {};
    rows.forEach((r) => {
      if (!r.checked) return;
      if (r.key === "airlineId") applied.airlineId = r.value;
      else if (r.key === "offerType") applied.offerType = r.value as AppliedOffer["offerType"];
      else if (r.key === "executionCost") applied.executionCost = r.value;
      else if (r.key === "flightDetails") applied.flightDetails = r.value;
      else if (r.key === "ticketingDeadline") applied.ticketingDeadline = r.value;
      else if (r.key === "paymentDeadline") applied.paymentDeadline = r.value;
      else if (r.key === "notes") {
        applied.notes = unmatchedAirline ? `الناقل: ${unmatchedAirline}` : r.value;
      }
    });
    if (matchedRequest && matchedRequest !== "none") {
      applied.matchedRequestId = matchedRequest.id;
    }
    onApply(applied);
    setRows(null);
    setMatchedRequest(null);
    setText("");
    setImageB64(null);
    setImageName(null);
    setOpen(false);
  }

  return (
    <Card className="border-dashed">
      <CardContent className="pt-5 space-y-3">
        <button
          type="button"
          className="text-sm font-medium text-primary flex items-center gap-2"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "▾ إخفاء" : "▸"} لصق عرض بسرعة (نص أو صورة)
        </button>

        {open && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="fast-offer-text">نص العرض (من واتساب / إيميل)</Label>
              <Textarea
                id="fast-offer-text"
                placeholder={"مثال: \"الخطوط السعودية (SV) اقتصادي\nالقاهرة → جدة\nالتكلفة 28,000 ج.م\nموعد الإصدار 27/09/2026 20:00\""}
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                dir="auto"
              />
            </div>

            <div className="space-y-1.5">
              <Label>أو صورة/لقطة شاشة للعرض (اختياري)</Label>
              <Input ref={fileRef} type="file" accept="image/*" onChange={handleFile} />
              {imageName && <p className="text-xs text-muted-foreground">{imageName}</p>}
              <p className="text-xs text-muted-foreground">
                يتم تحليل الصورة تلقائياً عند تهيئة مفتاح API (OFFER_EXTRACTION_API_KEY)، وإلا يُستخدم التحليل النصي المحلي.
              </p>
            </div>

            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={handleAnalyze} disabled={busy}>
                {busy ? "جاري التحليل..." : "تحليل وتعبئة"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setRows(null);
                  setText("");
                  setImageB64(null);
                  setImageName(null);
                  setError(null);
                }}
              >
                مسح
              </Button>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {rows && rows.length > 0 && (
              <div className="rounded-lg border p-3 space-y-2">
                <p className="text-sm font-medium">تم التعرف على البيانات — اختر ما تريد تعبئته:</p>
                {matchedRequest && matchedRequest !== "none" && (
                  <div className="rounded bg-primary/10 px-3 py-2 text-sm">
                    وجهة تُطابق الطلب: <span className="font-medium">{matchedRequest.label}</span>
                  </div>
                )}
                {matchedRequest === "none" && (
                  <div className="rounded bg-amber-100 px-3 py-2 text-sm text-amber-800">
                    الوجهة المُكتشفة لا تطابق أي طلب مفتوح — اختر الطلب يدوياً من نموذج الإضافة.
                  </div>
                )}
                {rows.map((r) => (
                  <label
                    key={String(r.key)}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={r.checked}
                      onChange={() => toggle(r.key)}
                    />
                    <span className="text-muted-foreground w-32 shrink-0">{r.label}:</span>
                    <span className="truncate" dir="auto">{r.value}</span>
                  </label>
                ))}
                <Button type="button" size="sm" onClick={handleApply}>
                  تعبئة النموذج بالبيانات المختارة
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
