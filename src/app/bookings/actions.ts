"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Set/update the selling price ("سعر البيع للعميل") for a booking.
// This is the missing link that drives customer balance, profit and the
// dashboard "needs attention" logic. Every change is recorded in price_history.
export async function setSellingPrice(data: {
  booking_id: string;
  selling_price: number;
  reason?: string;
  changed_by?: string;
}) {
  const bookingId = BigInt(data.booking_id);
  const sellingPrice = Number(data.selling_price);

  if (!Number.isFinite(sellingPrice) || sellingPrice < 0) {
    throw new Error("يجب إدخال سعر بيع صحيح");
  }

  const booking = await prisma.bookings.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      current_purchase_price: true,
      current_selling_price: true,
      currency: true,
    },
  });

  if (!booking) throw new Error("الحجز غير موجود");

  const purchase = Number(booking.current_purchase_price);
  const profit = sellingPrice - purchase;
  const reason = (data.reason || "").trim() || null;
  const changedBy = (data.changed_by || "").trim() || null;

  await prisma.$transaction([
    prisma.bookings.update({
      where: { id: bookingId },
      data: {
        current_selling_price: sellingPrice,
        current_profit: profit,
      },
    }),
    prisma.price_history.create({
      data: {
        booking_id: bookingId,
        execution_cost: purchase,
        selling_price: sellingPrice,
        profit,
        currency: booking.currency,
        changed_by: changedBy,
        reason,
      },
    }),
  ]);

  revalidatePath("/bookings");
  revalidatePath(`/bookings/${data.booking_id}`);
  revalidatePath("/dashboard");
  return { success: true };
}
