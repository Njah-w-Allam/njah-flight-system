"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { payment_method_enum } from "@prisma/client";

export async function createCustomerPayment(formData: FormData) {
  const bookingId = formData.get("booking_id") as string;
  const customerId = formData.get("customer_id") as string;
  const amount = formData.get("amount") as string;
  const paymentMethod = formData.get("payment_method") as string;
  const notes = (formData.get("notes") as string) || null;

  if (!bookingId) {
    throw new Error("يجب اختيار الحجز");
  }

  if (!customerId) {
    throw new Error("يجب اختيار العميل");
  }

  if (!amount || Number(amount) <= 0) {
    throw new Error("يجب إدخال مبلغ صحيح");
  }

  if (!paymentMethod) {
    throw new Error("يجب اختيار طريقة الدفع");
  }

  const validMethods: payment_method_enum[] = ["cash", "instapay", "vodafone_cash"];
  if (!validMethods.includes(paymentMethod as payment_method_enum)) {
    throw new Error("طريقة الدفع غير صحيحة");
  }

  await prisma.customer_payments.create({
    data: {
      booking_id: BigInt(bookingId),
      customer_id: BigInt(customerId),
      amount: Number(amount),
      payment_method: paymentMethod as payment_method_enum,
      notes: notes?.trim() || null,
    },
  });

  revalidatePath("/customer-payments");
}
