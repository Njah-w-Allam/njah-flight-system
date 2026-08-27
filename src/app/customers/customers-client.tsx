"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EGPAmount } from "@/components/status-badges";
import { createCustomer } from "./actions";
import Link from "next/link";
import { Plus, Search, Eye, UserPlus } from "lucide-react";
import { credit_status_enum } from "@prisma/client";

interface Customer {
  id: bigint;
  name: string;
  phone: string;
  address: string | null;
  balance: any;
  credit_status: credit_status_enum;
  currency: string;
  created_at: Date;
  _count: {
    bookings: number;
    customer_payments: number;
  };
}

const creditStatusMap: Record<
  credit_status_enum,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  NEW: { label: "جديد", variant: "secondary" },
  TRUSTED: { label: "موثوق", variant: "default" },
  RESTRICTED: { label: "مقيّد", variant: "destructive" },
};

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("ar-EG-u-nu-latn", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function CustomersClient({ customers }: { customers: Customer[] }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filtered = customers.filter(
    (c) =>
      !search ||
      c.name.includes(search) ||
      c.phone.includes(search)
  );

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createCustomer(formData);
      setOpen(false);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">العملاء</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button>
                <Plus className="ml-2 h-4 w-4" />
                إضافة عميل
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة عميل جديد</DialogTitle>
              <DialogDescription>
                أدخل بيانات العميل الجديد. الحقول المؤشرة بـ * مطلوبة.
              </DialogDescription>
            </DialogHeader>
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  الاسم <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="اسم العميل"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">
                  رقم الهاتف <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="01xxxxxxxxx"
                  required
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">العنوان</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="عنوان العميل (اختياري)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="أي ملاحظات إضافية..."
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "جاري الإنشاء..." : "إضافة العميل"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="بحث بالاسم أو رقم الهاتف..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">#</TableHead>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">الهاتف</TableHead>
                  <TableHead className="text-right">العنوان</TableHead>
                  <TableHead className="text-right">الرصيد</TableHead>
                  <TableHead className="text-right">حالة الرصيد</TableHead>
                  <TableHead className="text-right">الحجوزات</TableHead>
                  <TableHead className="text-right">المدفوعات</TableHead>
                  <TableHead className="text-right">تاريخ التسجيل</TableHead>
                  <TableHead className="text-right">التفاصيل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-8 text-muted-foreground"
                    >
                      لا يوجد عملاء
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((customer) => {
                    const status = creditStatusMap[customer.credit_status];
                    return (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">
                          {String(customer.id)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {customer.name}
                        </TableCell>
                        <TableCell dir="ltr" className="text-left">
                          {customer.phone}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {customer.address || "—"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              Number(customer.balance) >= 0
                                ? "text-green-600"
                                : "text-destructive"
                            }
                          >
                            <EGPAmount amount={customer.balance} />
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {customer._count.bookings}
                        </TableCell>
                        <TableCell className="text-center">
                          {customer._count.customer_payments}
                        </TableCell>
                        <TableCell>
                          {formatDate(customer.created_at)}
                        </TableCell>
                        <TableCell>
                          <Link href={`/customers/${customer.id}`}>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
