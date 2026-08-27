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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EGPAmount } from "@/components/status-badges";
import {
  responsible_party_enum,
  refund_status_enum,
} from "@prisma/client";
import { toast } from "sonner";
import { Plus, RotateCcw, Settings2 } from "lucide-react";
import { createRefund, processRefund, createModification } from "./actions";
import { InputJsonValue } from "@prisma/client/runtime/library";

interface ModificationRecord {
  id: bigint;
  ticket_id: bigint;
  old_data: unknown;
  new_data: unknown;
  fee: any;
  currency: string;
  paid_by: responsible_party_enum | null;
  modification_date: Date;
  notes: string | null;
  ticket: {
    ticket_number: string | null;
    pnr: string | null;
    booking: {
      customer: { name: string };
    };
  };
}

interface RefundRecord {
  id: bigint;
  ticket_id: bigint;
  expected_amount: any;
  actual_amount: any;
  refund_fee: any;
  currency: string;
  responsible_party: responsible_party_enum;
  status: refund_status_enum;
  refund_date: Date | null;
  notes: string | null;
  ticket: {
    ticket_number: string | null;
    pnr: string | null;
    booking: {
      customer: { name: string };
    };
  };
}

interface TicketOption {
  id: bigint;
  ticket_number: string | null;
  pnr: string | null;
  ticket_price: any;
  currency: string;
  booking: {
    customer: { name: string };
  };
}

const responsiblePartyLabels: Record<responsible_party_enum, string> = {
  customer: "العميل",
  execution_company: "شركة التنفيذ",
  owner: "المالك",
  shared: "مشترك",
};

const refundStatusLabels: Record<refund_status_enum, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "قيد الانتظار", variant: "outline" },
  approved: { label: "تمت الموافقة", variant: "default" },
  processed: { label: "تم التنفيذ", variant: "default" },
  rejected: { label: "مرفوض", variant: "destructive" },
};

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function JsonDisplay({ data }: { data: unknown }) {
  if (!data) return <span className="text-muted-foreground">—</span>;
  const obj = typeof data === "string" ? JSON.parse(data) : data;
  return (
    <div className="max-w-[200px]">
      <div className="text-xs bg-muted rounded-md p-2 font-mono leading-relaxed overflow-auto max-h-24">
        {Object.entries(obj as Record<string, unknown>).map(([k, v]) => (
          <div key={k}>
            <span className="text-muted-foreground">{k}:</span>{" "}
            <span>{String(v ?? "")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ModificationsClient({
  modifications,
  refunds,
  tickets,
}: {
  modifications: ModificationRecord[];
  refunds: RefundRecord[];
  tickets: TicketOption[];
}) {
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [processRefundDialogOpen, setProcessRefundDialogOpen] = useState(false);
  const [modDialogOpen, setModDialogOpen] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<RefundRecord | null>(null);
  const [isPending, startTransition] = useTransition();

  const [refundTicketId, setRefundTicketId] = useState<string>("");
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [refundParty, setRefundParty] = useState<string>("");
  const [refundNotes, setRefundNotes] = useState<string>("");

  const setRefundTicketIdSafe = (v: string | null) => setRefundTicketId(v ?? "");
  const setRefundPartySafe = (v: string | null) => setRefundParty(v ?? "");

  const [processAmount, setProcessAmount] = useState<string>("");
  const [processFee, setProcessFee] = useState<string>("");
  const [processStatus, setProcessStatus] = useState<string>("");

  const [modTicketId, setModTicketId] = useState<string>("");
  const [modOldData, setModOldData] = useState<string>("{}");
  const [modNewData, setModNewData] = useState<string>("{}");
  const [modFee, setModFee] = useState<string>("");
  const [modPaidBy, setModPaidBy] = useState<string>("");
  const [modNotes, setModNotes] = useState<string>("");

  const setProcessStatusSafe = (v: string | null) => setProcessStatus(v ?? "");
  const setModTicketIdSafe = (v: string | null) => setModTicketId(v ?? "");
  const setModPaidBySafe = (v: string | null) => setModPaidBy(v ?? "");

  function handleCreateRefund() {
    if (!refundTicketId || !refundAmount || !refundParty) {
      toast.error("خطأ", { description: "يرجى ملء جميع الحقول المطلوبة" });
      return;
    }
    startTransition(async () => {
      try {
        await createRefund(
          BigInt(refundTicketId),
          parseFloat(refundAmount),
          refundParty as responsible_party_enum,
          refundNotes || null
        );
        toast.success("تم", { description: "تم تسجيل طلب الاسترداد بنجاح" });
        setRefundDialogOpen(false);
        resetRefundForm();
      } catch (e: any) {
        toast.error("خطأ", { description: e.message || "حدث خطأ" });
      }
    });
  }

  function handleProcessRefund() {
    if (!selectedRefund || !processAmount || !processStatus) {
      toast.error("خطأ", { description: "يرجى ملء جميع الحقول المطلوبة" });
      return;
    }
    startTransition(async () => {
      try {
        await processRefund(
          selectedRefund.id,
          parseFloat(processAmount),
          parseFloat(processFee) || 0,
          processStatus as refund_status_enum
        );
        toast.success("تم", { description: "تم تحديث حالة الاسترداد بنجاح" });
        setProcessRefundDialogOpen(false);
        setSelectedRefund(null);
        resetProcessForm();
      } catch (e: any) {
        toast.error("خطأ", { description: e.message || "حدث خطأ" });
      }
    });
  }

  function handleCreateModification() {
    if (!modTicketId) {
      toast.error("خطأ", { description: "يرجى اختيار التذكرة" });
      return;
    }
    let oldData: Record<string, unknown>;
    let newData: Record<string, unknown>;
    try {
      oldData = JSON.parse(modOldData);
      newData = JSON.parse(modNewData);
    } catch {
      toast.error("خطأ", { description: "صيغة JSON غير صالحة" });
      return;
    }
    startTransition(async () => {
      try {
        await createModification(
          BigInt(modTicketId),
          oldData as unknown as InputJsonValue,
          newData as unknown as InputJsonValue,
          modFee ? parseFloat(modFee) : null,
          modPaidBy ? (modPaidBy as responsible_party_enum) : null,
          modNotes || null
        );
        toast.success("تم", { description: "تم تسجيل التعديل بنجاح" });
        setModDialogOpen(false);
        resetModForm();
      } catch (e: any) {
        toast.error("خطأ", { description: e.message || "حدث خطأ" });
      }
    });
  }

  function openProcessRefund(refund: RefundRecord) {
    setSelectedRefund(refund);
    setProcessAmount(String(Number(refund.expected_amount)));
    setProcessFee("");
    setProcessStatus("processed");
    setProcessRefundDialogOpen(true);
  }

  function resetRefundForm() {
    setRefundTicketId("");
    setRefundAmount("");
    setRefundParty("");
    setRefundNotes("");
  }

  function resetProcessForm() {
    setProcessAmount("");
    setProcessFee("");
    setProcessStatus("");
  }

  function resetModForm() {
    setModTicketId("");
    setModOldData("{}");
    setModNewData("{}");
    setModFee("");
    setModPaidBy("");
    setModNotes("");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">التعديلات والاستردادات</h1>
      </div>

      <Tabs defaultValue="modifications" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="modifications" className="flex items-center gap-1">
            <Settings2 className="h-4 w-4" />
            التعديلات ({modifications.length})
          </TabsTrigger>
          <TabsTrigger value="refunds" className="flex items-center gap-1">
            <RotateCcw className="h-4 w-4" />
            الاستردادات ({refunds.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="modifications" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setModDialogOpen(true)}>
              <Plus className="ml-2 h-4 w-4" />
              تسجيل تعديل
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">#</TableHead>
                      <TableHead className="text-right">التذكرة</TableHead>
                      <TableHead className="text-right">العميل</TableHead>
                      <TableHead className="text-right">البيانات القديمة</TableHead>
                      <TableHead className="text-right">البيانات الجديدة</TableHead>
                      <TableHead className="text-right">الرسوم</TableHead>
                      <TableHead className="text-right">الدافع</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">ملاحظات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modifications.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="text-center py-8 text-muted-foreground"
                        >
                          لا توجد تعديلات مسجلة
                        </TableCell>
                      </TableRow>
                    ) : (
                      modifications.map((mod) => (
                        <TableRow key={mod.id}>
                          <TableCell className="font-medium">
                            {String(mod.id)}
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <div>{mod.ticket.ticket_number || "—"}</div>
                              <div className="text-muted-foreground">
                                {mod.ticket.pnr || ""}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {mod.ticket.booking.customer.name}
                          </TableCell>
                          <TableCell>
                            <JsonDisplay data={mod.old_data} />
                          </TableCell>
                          <TableCell>
                            <JsonDisplay data={mod.new_data} />
                          </TableCell>
                          <TableCell>
                            {mod.fee ? <EGPAmount amount={mod.fee} /> : "—"}
                          </TableCell>
                          <TableCell>
                            {mod.paid_by
                              ? responsiblePartyLabels[mod.paid_by]
                              : "—"}
                          </TableCell>
                          <TableCell>
                            {formatDate(mod.modification_date)}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate">
                            {mod.notes || "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refunds" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setRefundDialogOpen(true)}>
              <Plus className="ml-2 h-4 w-4" />
              تسجيل استرداد
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">#</TableHead>
                      <TableHead className="text-right">التذكرة</TableHead>
                      <TableHead className="text-right">العميل</TableHead>
                      <TableHead className="text-right">المبلغ المتوقع</TableHead>
                      <TableHead className="text-right">المبلغ الفعلي</TableHead>
                      <TableHead className="text-right">رسوم الاسترداد</TableHead>
                      <TableHead className="text-right">الطرف المسؤول</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">تاريخ الاسترداد</TableHead>
                      <TableHead className="text-right">ملاحظات</TableHead>
                      <TableHead className="text-right">إجراء</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {refunds.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={11}
                          className="text-center py-8 text-muted-foreground"
                        >
                          لا توجد طلبات استرداد مسجلة
                        </TableCell>
                      </TableRow>
                    ) : (
                      refunds.map((refund) => {
                        const statusConfig =
                          refundStatusLabels[refund.status];
                        return (
                          <TableRow key={refund.id}>
                            <TableCell className="font-medium">
                              {String(refund.id)}
                            </TableCell>
                            <TableCell>
                              <div className="text-xs">
                                <div>{refund.ticket.ticket_number || "—"}</div>
                                <div className="text-muted-foreground">
                                  {refund.ticket.pnr || ""}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {refund.ticket.booking.customer.name}
                            </TableCell>
                            <TableCell>
                              <EGPAmount amount={refund.expected_amount} />
                            </TableCell>
                            <TableCell>
                              {refund.actual_amount ? (
                                <EGPAmount amount={refund.actual_amount} />
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell>
                              {refund.refund_fee ? (
                                <EGPAmount amount={refund.refund_fee} />
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell>
                              {responsiblePartyLabels[refund.responsible_party]}
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusConfig.variant}>
                                {statusConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {refund.refund_date
                                ? formatDate(refund.refund_date)
                                : "—"}
                            </TableCell>
                            <TableCell className="max-w-[120px] truncate">
                              {refund.notes || "—"}
                            </TableCell>
                            <TableCell>
                              {refund.status === "pending" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openProcessRefund(refund)}
                                >
                                  تنفيذ
                                </Button>
                              )}
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
        </TabsContent>
      </Tabs>

      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تسجيل استرداد جديد</DialogTitle>
            <DialogDescription>
              أدخل بيانات طلب الاسترداد. الحقول المؤشرة بـ * مطلوبة.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                التذكرة <span className="text-destructive">*</span>
              </Label>
              <Select value={refundTicketId} onValueChange={setRefundTicketIdSafe}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر التذكرة" />
                </SelectTrigger>
                <SelectContent>
                  {tickets.map((t) => (
                    <SelectItem key={String(t.id)} value={String(t.id)}>
                      {t.ticket_number || "بدون رقم"} — {t.booking.customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                المبلغ المتوقع (ج.م) <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>
                الطرف المسؤول <span className="text-destructive">*</span>
              </Label>
              <Select value={refundParty} onValueChange={setRefundPartySafe}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر الطرف المسؤول" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">العميل</SelectItem>
                  <SelectItem value="execution_company">شركة التنفيذ</SelectItem>
                  <SelectItem value="owner">المالك</SelectItem>
                  <SelectItem value="shared">مشترك</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea
                value={refundNotes}
                onChange={(e) => setRefundNotes(e.target.value)}
                placeholder="أي ملاحظات..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateRefund} disabled={isPending}>
              {isPending ? "جاري الحفظ..." : "تسجيل الاسترداد"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={processRefundDialogOpen}
        onOpenChange={setProcessRefundDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تنفيذ الاسترداد</DialogTitle>
            <DialogDescription>
              أدخل بيانات التنفيذ الفعلي للاسترداد.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRefund && (
              <div className="rounded-md bg-muted p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">التذكرة:</span>
                  <span>
                    {selectedRefund.ticket.ticket_number || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المبلغ المتوقع:</span>
                  <span>
                    <EGPAmount amount={selectedRefund.expected_amount} />
                  </span>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>
                المبلغ الفعلي (ج.م) <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={processAmount}
                onChange={(e) => setProcessAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>رسوم الاسترداد (ج.م)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={processFee}
                onChange={(e) => setProcessFee(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>
                الحالة <span className="text-destructive">*</span>
              </Label>
              <Select value={processStatus} onValueChange={setProcessStatusSafe}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">تمت الموافقة</SelectItem>
                  <SelectItem value="processed">تم التنفيذ</SelectItem>
                  <SelectItem value="rejected">مرفوض</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleProcessRefund} disabled={isPending}>
              {isPending ? "جاري التحديث..." : "تحديث الاسترداد"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modDialogOpen} onOpenChange={setModDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>تسجيل تعديل جديد</DialogTitle>
            <DialogDescription>
              أدخل بيانات التعديل على التذكرة.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                التذكرة <span className="text-destructive">*</span>
              </Label>
              <Select value={modTicketId} onValueChange={setModTicketIdSafe}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر التذكرة" />
                </SelectTrigger>
                <SelectContent>
                  {tickets.map((t) => (
                    <SelectItem key={String(t.id)} value={String(t.id)}>
                      {t.ticket_number || "بدون رقم"} — {t.booking.customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  البيانات القديمة (JSON) <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  value={modOldData}
                  onChange={(e) => setModOldData(e.target.value)}
                  placeholder='{"key": "value"}'
                  rows={4}
                  dir="ltr"
                  className="font-mono text-xs text-left"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  البيانات الجديدة (JSON) <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  value={modNewData}
                  onChange={(e) => setModNewData(e.target.value)}
                  placeholder='{"key": "value"}'
                  rows={4}
                  dir="ltr"
                  className="font-mono text-xs text-left"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>رسوم التعديل (ج.م)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={modFee}
                  onChange={(e) => setModFee(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>دافع الدفع</Label>
                <Select value={modPaidBy} onValueChange={setModPaidBySafe}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر الدافع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">العميل</SelectItem>
                    <SelectItem value="execution_company">شركة التنفيذ</SelectItem>
                    <SelectItem value="owner">المالك</SelectItem>
                    <SelectItem value="shared">مشترك</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea
                value={modNotes}
                onChange={(e) => setModNotes(e.target.value)}
                placeholder="أي ملاحظات..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateModification} disabled={isPending}>
              {isPending ? "جاري الحفظ..." : "تسجيل التعديل"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
