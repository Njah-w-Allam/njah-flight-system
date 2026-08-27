"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createExecutionOffer, createAirline } from "../actions";

interface Request {
  id: string;
  origin: string;
  destination: string;
  trip_type: string;
  depart_date: string;
  return_date: string | null;
  passengers_count: number;
  status: string;
  customer_name: string;
}

interface ExecutionCompany {
  id: string;
  name: string;
}

interface Airline {
  id: string;
  name: string;
  code: string | null;
}

interface Props {
  requests: Request[];
  executionCompanies: ExecutionCompany[];
  airlines: Airline[];
}

export function OfferForm({ requests, executionCompanies, airlines }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [requestId, setRequestId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [airlineId, setAirlineId] = useState("");
  const [offerType, setOfferType] = useState("");
  const [executionCost, setExecutionCost] = useState("");
  const [flightDetails, setFlightDetails] = useState("");
  const [ticketingDeadline, setTicketingDeadline] = useState("");
  const [paymentDeadline, setPaymentDeadline] = useState("");
  const [notes, setNotes] = useState("");

  const [showNewAirline, setShowNewAirline] = useState(false);
  const [newAirlineName, setNewAirlineName] = useState("");
  const [newAirlineCode, setNewAirlineCode] = useState("");
  const [airlineList, setAirlineList] = useState(airlines);

  async function handleAddAirline() {
    if (!newAirlineName.trim()) return;
    const result = await createAirline(newAirlineName.trim(), newAirlineCode.trim() || undefined);
    if (result.success) {
      setAirlineList((prev) => [...prev, { id: result.id, name: result.name, code: newAirlineCode.trim() || null }]);
      setAirlineId(result.id);
      setShowNewAirline(false);
      setNewAirlineName("");
      setNewAirlineCode("");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!requestId || !companyId || !airlineId || !offerType || !executionCost) {
      setError("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    startTransition(async () => {
      try {
        const result = await createExecutionOffer({
          request_id: requestId,
          execution_company_id: companyId,
          airline_id: airlineId,
          offer_type: offerType,
          execution_cost: Number(executionCost),
          flight_details: flightDetails || undefined,
          ticketing_deadline: ticketingDeadline || undefined,
          payment_deadline: paymentDeadline || undefined,
          notes: notes || undefined,
        });

        if (result.success) {
          setSuccess(true);
          setTimeout(() => router.push("/execution-offers"), 1500);
        }
      } catch (err: any) {
        setError(err.message || "حدث خطأ أثناء إنشاء العرض");
      }
    });
  }

  if (success) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-lg font-medium text-green-600">
            تم إنشاء العرض بنجاح
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            جاري التحويل إلى صفحة العروض...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="pt-6 space-y-6">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>الطلب *</Label>
              <Select value={requestId} onValueChange={(v) => setRequestId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر الطلب" />
                </SelectTrigger>
                <SelectContent>
                  {requests.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      #{r.id} - {r.customer_name} - {r.origin} → {r.destination} ({r.passengers_count} راكب)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>شركة التنفيذ *</Label>
              <Select value={companyId} onValueChange={(v) => setCompanyId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر شركة التنفيذ" />
                </SelectTrigger>
                <SelectContent>
                  {executionCompanies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الناقل (شركة الطيران) *</Label>
              {!showNewAirline ? (
                <div className="flex gap-2">
                  <Select value={airlineId} onValueChange={(v) => setAirlineId(v ?? "")}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="اختر الناقل" />
                    </SelectTrigger>
                    <SelectContent>
                      {airlineList.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name} {a.code && `(${a.code})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewAirline(true)}
                  >
                    +
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="اسم الناقل"
                      value={newAirlineName}
                      onChange={(e) => setNewAirlineName(e.target.value)}
                    />
                    <Input
                      placeholder="الكود (اختياري)"
                      value={newAirlineCode}
                      onChange={(e) => setNewAirlineCode(e.target.value)}
                      className="w-24"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddAirline}
                      disabled={!newAirlineName.trim()}
                    >
                      إضافة
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowNewAirline(false);
                        setNewAirlineName("");
                        setNewAirlineCode("");
                      }}
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>نوع العرض *</Label>
              <Select value={offerType} onValueChange={(v) => setOfferType(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر نوع العرض" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="economy">اقتصادي</SelectItem>
                  <SelectItem value="business">بيزنس</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>تكلفة التنفيذ *</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={executionCost}
                onChange={(e) => setExecutionCost(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label>موعد الإصدار</Label>
              <Input
                type="datetime-local"
                value={ticketingDeadline}
                onChange={(e) => setTicketingDeadline(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>موعد الدفع</Label>
              <Input
                type="datetime-local"
                value={paymentDeadline}
                onChange={(e) => setPaymentDeadline(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>تفاصيل الرحلة</Label>
            <Textarea
              placeholder="تفاصيل الرحلة..."
              value={flightDetails}
              onChange={(e) => setFlightDetails(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea
              placeholder="ملاحظات إضافية..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "جاري الإنشاء..." : "إنشاء العرض"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/execution-offers")}
            >
              إلغاء
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
