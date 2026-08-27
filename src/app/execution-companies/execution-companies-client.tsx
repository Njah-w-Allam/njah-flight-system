"use client";

import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { createExecutionCompany } from "./actions";
import Link from "next/link";
import { Plus, Search, Eye, Building2 } from "lucide-react";
import { toast } from "sonner";

interface Company {
  id: bigint;
  name: string;
  contact_person: string | null;
  phone: string | null;
  address: string | null;
  balance: any;
  currency: string;
  created_at: Date;
  _count: {
    execution_offers: number;
    bookings: number;
    execution_payments: number;
  };
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("ar-EG-u-nu-latn", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ExecutionCompaniesClient({
  companies,
}: {
  companies: Company[];
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const filtered = companies.filter(
    (c) => !search || c.name.includes(search) || (c.contact_person && c.contact_person.includes(search))
  );

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    try {
      await createExecutionCompany(formData);
      toast.success("تمت الإضافة", { description: "تم إضافة شركة التنفيذ بنجاح" });
      setOpen(false);
      formRef.current?.reset();
    } catch (e: any) {
      toast.error("خطأ", { description: e.message || "حدث خطأ أثناء الإضافة" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">شركات التنفيذ</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="ml-2 h-4 w-4" />
            إضافة شركة تنفيذ
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة شركة تنفيذ جديدة</DialogTitle>
              <DialogDescription>
                أدخل بيانات شركة التنفيذ الجديدة
              </DialogDescription>
            </DialogHeader>
            <form ref={formRef} action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">اسم الشركة *</Label>
                <Input id="name" name="name" required placeholder="اسم شركة التنفيذ" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_person">جهة الاتصال</Label>
                <Input id="contact_person" name="contact_person" placeholder="اسم جهة الاتصال" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input id="phone" name="phone" placeholder="رقم الهاتف" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">العنوان</Label>
                <Textarea id="address" name="address" placeholder="عنوان الشركة" />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "جاري الإضافة..." : "إضافة"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="بحث بالاسم..."
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
                  <TableHead className="text-right">اسم الشركة</TableHead>
                  <TableHead className="text-right">جهة الاتصال</TableHead>
                  <TableHead className="text-right">الهاتف</TableHead>
                  <TableHead className="text-right">الرصيد</TableHead>
                  <TableHead className="text-right">العروض</TableHead>
                  <TableHead className="text-right">الحجوزات</TableHead>
                  <TableHead className="text-right">المدفوعات</TableHead>
                  <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                  <TableHead className="text-right">تفاصيل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-8 text-muted-foreground"
                    >
                      <Building2 className="mx-auto mb-2 h-8 w-8 opacity-50" />
                      لا توجد شركات تنفيذ
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">
                        {String(company.id)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {company.name}
                      </TableCell>
                      <TableCell>{company.contact_person || "—"}</TableCell>
                      <TableCell className="num-ltr">{company.phone || "—"}</TableCell>
                      <TableCell>
                        <span
                          className={
                            Number(company.balance) > 0
                              ? "text-green-600"
                              : Number(company.balance) < 0
                                ? "text-destructive"
                                : ""
                          }
                        >
                          <EGPAmount amount={company.balance} />
                        </span>
                      </TableCell>
                      <TableCell>{company._count.execution_offers}</TableCell>
                      <TableCell>{company._count.bookings}</TableCell>
                      <TableCell>{company._count.execution_payments}</TableCell>
                      <TableCell>{formatDate(company.created_at)}</TableCell>
                      <TableCell>
                        <Link href={`/execution-companies/${company.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
