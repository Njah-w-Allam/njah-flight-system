import { NextRequest, NextResponse } from "next/server";
import { parseOfferText, ParsedOffer } from "@/lib/offer-parser";

export const dynamic = "force-dynamic";

// Optional image/text extraction endpoint.
// Enabled only when OFFER_EXTRACTION_API_KEY is set. When not configured, the
// client uses the local (offline) parser instead. Provider & model are
// configurable via env vars so the same UI works with OpenAI or Gemini.
//
//   OFFER_EXTRACTION_API_KEY   required to enable
//   OFFER_EXTRACTION_PROVIDER  "openai" | "gemini"   (default "openai")
//   OFFER_EXTRACTION_MODEL     default: gpt-4o-mini / gemini-2.0-flash
//   OFFER_EXTRACTION_BASE_URL  optional custom endpoint base

interface Extracted {
  airline?: string;
  airlineCode?: string;
  executionCost?: number;
  offerType?: "economy" | "business" | "other";
  flightDetails?: string;
  ticketingDeadline?: string;
  paymentDeadline?: string;
}

function isEnabled(): boolean {
  return Boolean(process.env.OFFER_EXTRACTION_API_KEY);
}

function provider(): string {
  return (process.env.OFFER_EXTRACTION_PROVIDER || "openai").toLowerCase();
}

function parseLLMJson(text: string): Partial<Extracted> {
  // The model may wrap JSON in ```json fences or extra prose; extract the first
  // object and apply the local parser as a safety net for missing numeric/dates.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const objMatch = candidate.match(/\{[\s\S]*\}/);
  if (!objMatch) return {};
  try {
    return JSON.parse(objMatch[0]);
  } catch {
    return {};
  }
}

async function extractWithOpenAI(imageB64: string | null, prompt: string): Promise<Partial<Extracted>> {
  const base = process.env.OFFER_EXTRACTION_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.OFFER_EXTRACTION_MODEL || "gpt-4o-mini";
  const content: any[] = [{ type: "text", text: prompt }];
  if (imageB64) content.push({ type: "image_url", image_url: { url: `data:image/png;base64,${imageB64}` } });

  const resp = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OFFER_EXTRACTION_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content }],
    }),
  });
  if (!resp.ok) throw new Error(`Vision API error (${resp.status})`);
  const data = await resp.json();
  return parseLLMJson(data?.choices?.[0]?.message?.content || "");
}

async function extractWithGemini(imageB64: string | null, prompt: string): Promise<Partial<Extracted>> {
  const base = process.env.OFFER_EXTRACTION_BASE_URL || "https://generativelanguage.googleapis.com/v1beta";
  const model = process.env.OFFER_EXTRACTION_MODEL || "gemini-2.0-flash";
  const parts: any[] = [{ text: prompt }];
  if (imageB64) parts.push({ inline_data: { mime_type: "image/png", data: imageB64 } });

  const resp = await fetch(`${base}/models/${model}:generateContent?key=${process.env.OFFER_EXTRACTION_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature: 0, responseMimeType: "application/json" },
    }),
  });
  if (!resp.ok) throw new Error(`Vision API error (${resp.status})`);
  const data = await resp.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return parseLLMJson(text);
}

export async function POST(req: NextRequest) {
  if (!isEnabled()) {
    return NextResponse.json({ enabled: false });
  }

  let body: { text?: string; image?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const imageB64 = typeof body.image === "string" && body.image ? body.image : null;
  const rawText = (body.text || "").toString();

  const prompt = [
    "Extract booking-offer fields from the following WhatsApp offer text or screenshot. Return ONLY JSON:",
    `{"airline","airlineCode","executionCost"(number),"offerType"("economy"|"business"|"other"),"flightDetails","ticketingDeadline"(ISO "YYYY-MM-DDTHH:mm"),"paymentDeadline"(ISO "YYYY-MM-DDTHH:mm")}`,
    "Emission: use Arabic airline names, omit any field you cannot determine. Text:",
    rawText,
  ].join("\n");

  let extracted: Partial<Extracted> = {};
  const prov = provider();
  try {
    extracted =
      prov === "gemini"
        ? await extractWithGemini(imageB64, prompt)
        : await extractWithOpenAI(imageB64, prompt);
  } catch (err: any) {
    return NextResponse.json({ enabled: true, error: err?.message || "extraction failed" }, { status: 502 });
  }

  // Safety net: if the model failed to produce a cost, fall back to the local parser.
  let cost = typeof extracted.executionCost === "number" ? extracted.executionCost : undefined;
  const local = parseOfferText(rawText);
  if (cost === undefined) cost = local.executionCost;
  if (!extracted.airline) extracted.airline = local.airline;
  if (!extracted.airlineCode) extracted.airlineCode = local.airlineCode;
  if (!extracted.offerType) extracted.offerType = local.offerType;
  if (!extracted.flightDetails) extracted.flightDetails = local.flightDetails;
  if (!extracted.ticketingDeadline) extracted.ticketingDeadline = local.ticketingDeadline;
  if (!extracted.paymentDeadline) extracted.paymentDeadline = local.paymentDeadline;

  const out: ParsedOffer & { enabled: true } = {
    airline: extracted.airline,
    airlineCode: extracted.airlineCode,
    executionCost: cost,
    offerType: extracted.offerType,
    flightDetails: extracted.flightDetails,
    ticketingDeadline: extracted.ticketingDeadline,
    paymentDeadline: extracted.paymentDeadline,
    confidence: 0.9,
    enabled: true,
  };
  return NextResponse.json(out);
}
