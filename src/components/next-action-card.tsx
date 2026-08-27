"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  bookingNextAction,
  type BookingFlowBooking,
  type NextAction,
} from "@/lib/booking-flow";
import {
  AlertTriangle,
  Info,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

const severityStyle: Record<
  NextAction["severity"],
  { card: string; icon: typeof AlertTriangle; iconClass: string; chip: string }
> = {
  critical: {
    card: "border-red-500/60 bg-red-500/5",
    icon: AlertTriangle,
    iconClass: "text-red-600",
    chip: "bg-red-600 text-white",
  },
  warning: {
    card: "border-amber-500/60 bg-amber-500/5",
    icon: AlertTriangle,
    iconClass: "text-amber-600",
    chip: "bg-amber-500 text-white",
  },
  info: {
    card: "border-sky-500/50 bg-sky-500/5",
    icon: Info,
    iconClass: "text-sky-600",
    chip: "bg-sky-600 text-white",
  },
  success: {
    card: "border-emerald-500/60 bg-emerald-500/5",
    icon: CheckCircle2,
    iconClass: "text-emerald-600",
    chip: "bg-emerald-600 text-white",
  },
};

export function NextActionCard({
  booking,
  onPrimary,
}: {
  booking: BookingFlowBooking;
  onPrimary?: () => void;
}) {
  const action = bookingNextAction(booking);
  if (!action) return null;
  const s = severityStyle[action.severity];

  return (
    <Card className={cn("border-2", s.card)}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                s.chip
              )}
            >
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-0.5">
                الإجراء التالي
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{action.title}</span>
                {action.severity === "critical" && (
                  <span className="rounded bg-red-600/10 px-1.5 py-0.5 text-xs font-semibold text-red-600">
                    مطلوب الآن
                  </span>
                )}
              </div>
              {action.detail && (
                <p className="mt-1 text-sm text-muted-foreground">{action.detail}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onPrimary ? (
              <Button onClick={onPrimary}>
                {action.ctaLabel}
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>
            ) : action.ctaHref ? (
              <Button render={<Link href={action.ctaHref} />}>
                {action.ctaLabel}
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>
            ) : (
              <span className="text-sm font-medium text-muted-foreground">
                {action.ctaLabel}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
