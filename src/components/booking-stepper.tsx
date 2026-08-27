"use client";

import { cn } from "@/lib/utils";

// Business lifecycle steps (visual, not a source of truth).
// Each step maps to a booking_status the backend can actually produce.
const STEPS = [
  { key: "request", label: "الطلب" },
  { key: "offers", label: "العروض" },
  { key: "booking", label: "الحجز" },
  { key: "payment", label: "الدفع" },
  { key: "issuance", label: "الإصدار" },
  { key: "travel", label: "السفر" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

// Map booking_status -> furthest completed logical step.
// e.g. WAITING_PAYMENT means up to "الحجز" done, payment in progress.
function currentStep(status: string): StepKey {
  switch (status) {
    case "NEW":
      return "booking";
    case "WAITING_PAYMENT":
      return "payment";
    case "WAITING_TICKETING":
      return "payment";
    case "TICKETED":
    case "MODIFIED":
      return "issuance";
    case "COMPLETED":
      return "travel";
    case "CANCELLED":
    case "PARTIALLY_CANCELLED":
      return "booking";
    default:
      return "booking";
  }
}

const stepIndex = (key: StepKey) => STEPS.findIndex((s) => s.key === key);

// For the stepper, a step is "done" when it's before the current step,
// "active" when it equals the current step, "blocked" (risk) handled specially.
export function BookingStepper({ status }: { status: string }) {
  const current = currentStep(status);
  const currentIdx = stepIndex(current);
  const isTerminal = status === "CANCELLED" || status === "PARTIALLY_CANCELLED";

  return (
    <ol className="flex items-center gap-1 overflow-x-auto pb-1" aria-label="دورة الحجز">
      {STEPS.map((step, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx && !isTerminal;
        return (
          <li key={step.key} className="flex items-center gap-1 min-w-0">
            <div className="flex flex-col items-center gap-1 min-w-0">
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  done && "bg-emerald-600 text-white",
                  active && "bg-primary text-primary-foreground ring-4 ring-primary/15",
                  !done && !active && "bg-muted text-muted-foreground"
                )}
              >
                {done ? "✓" : idx + 1}
              </div>
              <span
                className={cn(
                  "text-[10px] leading-tight whitespace-nowrap",
                  active ? "font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-4 sm:w-6 mb-5",
                  idx < currentIdx ? "bg-emerald-600" : "bg-muted"
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
