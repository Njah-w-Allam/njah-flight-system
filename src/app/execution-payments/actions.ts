"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createExecutionPayment(formData: FormData) {
  const bookingId = formData.get("booking_id") as string;
  const executionCompanyId = formData.get("execution_company_id") as string;
  const amount = formData.get("amount") as string;
  const notes = (formData.get("notes") as string) || null;

  if (!bookingId) {
    throw new Error("يجب اختيار الحجز");
  }

  if (!executionCompanyId) {
    throw new Error("يجب اختيار شركة التنفيذ");
  }

  if (!amount || Number(amount) <= 0) {
    throw new Error("يجب إدخال مبلغ صحيح");
  }

  await prisma.execution_payments.create({
    data: {
      booking_id: BigInt(bookingId),
      execution_company_id: BigInt(executionCompanyId),
      amount: Number(amount),
      notes: notes?.trim() || null,
    },
  });

  revalidatePath("/execution-payments");
}
