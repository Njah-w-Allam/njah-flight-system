"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { createBookingRequest } from "../actions";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { CustomerField, type CustomerSelection } from "@/components/customer-field";

interface Customer {
  id: bigint;
  name: string;
  phone: string;
}

export function BookingRequestForm({ customers }: { customers: Customer[] }) {
  const [customer, setCustomer] = useState<CustomerSelection>(null);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [tripType, setTripType] = useState<"one_way" | "round_trip">("one_way");
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [passengersCount, setPassengersCount] = useState(1);
  const [requirements, setRequirements] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    if (!customer) {
      setIsSubmitting(false);
      return;
    }

    try {
      const data: {
        customer_id: bigint;
        origin: string;
        destination: string;
        trip_type: "one_way" | "round_trip";
        depart_date: string;
        return_date: string | null;
        passengers_count: number;
        requirements: string | null;
        notes: string | null;
        new_customer_name?: string;
        new_customer_phone?: string;
      } = {
        customer_id: customer.kind === "existing" ? BigInt(customer.id) : BigInt(0),
        origin,
        destination,
        trip_type: tripType,
        depart_date: departDate,
        return_date: tripType === "round_trip" ? returnDate : null,
        passengers_count: passengersCount,
        requirements: requirements || null,
        notes: notes || null,
      };

      if (customer.kind === "new") {
        data.new_customer_name = customer.name;
        data.new_customer_phone = customer.phone;
      }

      await createBookingRequest(data);
    } catch {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/booking-requests">
          <Button variant="ghost" size="icon">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">طلب حجز جديد</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">بيانات العميل</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>العميل (اكتب الاسم أو رقم الهاتف)</Label>
              <CustomerField
                customers={customers.map((c) => ({
                  id: String(c.id),
                  name: c.name,
                  phone: c.phone,
                }))}
                value={customer}
                onChange={setCustomer}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">تفاصيل الرحلة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="origin">المدينة المغادرة</Label>
                <Input
                  id="origin"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="مثال: القاهرة"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">المدينة المقصودة</Label>
                <Input
                  id="destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="مثال: إسطنبول"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>نوع الرحلة</Label>
                <Select
                  value={tripType}
                  onValueChange={(v) => v && setTripType(v as "one_way" | "round_trip")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_way">ذهاب فقط</SelectItem>
                    <SelectItem value="round_trip">ذهاب وعودة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="departDate">تاريخ السفر</Label>
                <Input
                  id="departDate"
                  type="date"
                  value={departDate}
                  onChange={(e) => setDepartDate(e.target.value)}
                  required
                />
              </div>
              {tripType === "round_trip" && (
                <div className="space-y-2">
                  <Label htmlFor="returnDate">تاريخ العودة</Label>
                  <Input
                    id="returnDate"
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="passengersCount">عدد المسافرين</Label>
                <Input
                  id="passengersCount"
                  type="number"
                  min={1}
                  value={passengersCount}
                  onChange={(e) => setPassengersCount(Number(e.target.value))}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">ملاحظات وإضافات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="requirements">المتطلبات</Label>
              <Textarea
                id="requirements"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="أي متطلبات خاصة للرحلة..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات داخلية</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ملاحظات للمرجع الداخلي..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/booking-requests">
            <Button type="button" variant="outline">
              إلغاء
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "جاري الإنشاء..." : "إنشاء طلب الحجز"}
          </Button>
        </div>
      </form>
    </div>
  );
}
