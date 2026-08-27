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

  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    throw new Error("يجب إدخال مبلغ صحيح");
  }

  if (!paymentMethod) {
    throw new Error("يجب اختيار طريقة الدفع");
  }

  const validMethods: payment_method_enum[] = ["cash", "instapay", "vodafone_cash"];
  if (!validMethods.includes(paymentMethod as payment_method_enum)) {
    throw new Error("طريقة الدفع غير صحيحة");
  }

  const booking = await prisma.bookings.findUnique({
    where: { id: BigInt(bookingId) },
    select: { customer_id: true },
  });
  if (!booking) throw new Error("الحجز غير موجود");
  if (String(booking.customer_id) !== String(customerId)) {
    throw new Error("العميل لا يتبع هذا الحجز");
  }

  await prisma.customer_payments.create({
    data: {
      booking_id: BigInt(bookingId),
      customer_id: BigInt(customerId),
      amount: amountNum,
      payment_method: paymentMethod as payment_method_enum,
      notes: notes?.trim() || null,
    },
  });

  revalidatePath("/customer-payments");
  revalidatePath("/dashboard");
  revalidatePath("/bookings");
}
