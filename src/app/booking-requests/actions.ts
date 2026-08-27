"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  booking_request_status_enum,
  trip_type_enum,
} from "@prisma/client";

export async function createBookingRequest(data: {
  customer_id: bigint;
  origin: string;
  destination: string;
  trip_type: trip_type_enum;
  depart_date: string;
  return_date?: string | null;
  passengers_count: number;
  requirements?: string | null;
  notes?: string | null;
  new_customer_name?: string;
  new_customer_phone?: string;
}) {
  let customerId = data.customer_id;

  if (data.new_customer_name && data.new_customer_phone) {
    const customer = await prisma.customers.create({
      data: {
        name: data.new_customer_name,
        phone: data.new_customer_phone,
      },
    });
    customerId = customer.id;
  }

  const created = await prisma.booking_requests.create({
    data: {
      customer_id: customerId,
      origin: data.origin,
      destination: data.destination,
      trip_type: data.trip_type,
      depart_date: new Date(data.depart_date),
      return_date: data.return_date ? new Date(data.return_date) : null,
      passengers_count: data.passengers_count,
      requirements: data.requirements || null,
      notes: data.notes || null,
      status: "NEW",
    },
  });

  revalidatePath("/booking-requests");
  revalidatePath("/dashboard");
  redirect(`/execution-offers?request=${created.id}`);
}

export async function updateBookingRequestStatus(
  id: bigint,
  status: booking_request_status_enum
) {
  await prisma.booking_requests.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/booking-requests");
  revalidatePath(`/booking-requests/${id}`);
}

export async function convertToBooking(requestId: bigint) {
  await prisma.booking_requests.update({
    where: { id: requestId },
    data: { status: "CONVERTED" },
  });

  revalidatePath("/booking-requests");
  revalidatePath(`/booking-requests/${requestId}`);
}
