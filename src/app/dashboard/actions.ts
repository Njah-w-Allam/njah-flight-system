"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { trip_type_enum, payment_method_enum } from "@prisma/client";

// Quick-create booking request (returns the new request id so the UI can
// continue directly into the offers/workspace flow). Mirrors the business
// logic of booking-requests/actions.ts but stays in-context instead of
// redirecting to the list page.
export async function createBookingRequestQuick(data: {
  customer_id?: string;
  new_customer_name?: string;
  new_customer_phone?: string;
  origin: string;
  destination: string;
  depart_date: string;
  passengers_count: number;
  return_date?: string;
}) {
  if (!data.origin?.trim() || !data.destination?.trim() || !data.depart_date) {
    throw new Error("يرجى إدخال المدن وتاريخ السفر");
  }

  let customerId: bigint;
  if (data.new_customer_name && data.new_customer_phone) {
    const customer = await prisma.customers.create({
      data: {
        name: data.new_customer_name.trim(),
        phone: data.new_customer_phone.trim(),
      },
    });
    customerId = customer.id;
  } else if (data.customer_id) {
    customerId = BigInt(data.customer_id);
  } else {
    throw new Error("يرجى اختيار العميل أو إدخال بيانات عميل جديد");
  }

  const request = await prisma.booking_requests.create({
    data: {
      customer_id: customerId,
      origin: data.origin.trim(),
      destination: data.destination.trim(),
      trip_type: (data.return_date ? "round_trip" : "one_way") as trip_type_enum,
      depart_date: new Date(data.depart_date),
      return_date: data.return_date ? new Date(data.return_date) : null,
      passengers_count: data.passengers_count,
      status: "NEW",
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/booking-requests");
  return { success: true, id: String(request.id) };
}

export async function createCustomerQuick(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!name || !phone) {
    throw new Error("اسم العميل ورقم الهاتف مطلوبان");
  }

  const customer = await prisma.customers.create({ data: { name, phone, notes } });
  revalidatePath("/dashboard");
  revalidatePath("/customers");
  return { success: true, id: String(customer.id), name, phone };
}

export async function createPaymentQuick(formData: FormData) {
  const bookingId = formData.get("booking_id") as string;
  const customerId = formData.get("customer_id") as string;
  const amountRaw = formData.get("amount") as string;
  const paymentMethod = formData.get("payment_method") as string;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!bookingId) throw new Error("يجب اختيار الحجز");
  if (!customerId) throw new Error("يجب اختيار العميل");
  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("يجب إدخال مبلغ صحيح");
  if (!paymentMethod) throw new Error("يجب اختيار طريقة الدفع");

  const valid: payment_method_enum[] = ["cash", "instapay", "vodafone_cash"];
  if (!valid.includes(paymentMethod as payment_method_enum)) {
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
      amount,
      payment_method: paymentMethod as payment_method_enum,
      notes,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/customer-payments");
  revalidatePath("/bookings");
  return { success: true };
}

export async function createTicketQuick(formData: FormData) {
  const bookingIdRaw = formData.get("booking_id") as string;
  const airlineIdRaw = formData.get("airline_id") as string;

  if (!bookingIdRaw) throw new Error("رقم الحجز مطلوب");
  if (!airlineIdRaw) throw new Error("يجب اختيار شركة الطيران");

  const bookingId = BigInt(bookingIdRaw);
  const airlineId = BigInt(airlineIdRaw);
  const ticketNumber = (formData.get("ticket_number") as string)?.trim() || null;
  const pnr = (formData.get("pnr") as string)?.trim() || null;
  const ticketPrice = parseFloat((formData.get("ticket_price") as string) || "0");
  const notes = (formData.get("notes") as string)?.trim() || null;
  const passengerIds = formData.getAll("passenger_ids") as string[];

  const ticket = await prisma.tickets.create({
    data: {
      booking_id: bookingId,
      airline_id: airlineId,
      ticket_number: ticketNumber,
      pnr,
      ticket_price: Number.isFinite(ticketPrice) ? ticketPrice : 0,
      notes,
    },
  });

  if (passengerIds.length > 0) {
    await prisma.ticket_passengers.createMany({
      data: passengerIds.map((pid) => ({
        ticket_id: ticket.id,
        passenger_id: BigInt(pid),
      })),
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/tickets");
  revalidatePath("/bookings");
  return { success: true, id: String(ticket.id) };
}

export async function createOfferQuick(formData: FormData) {
  const requestId = formData.get("request_id") as string;
  const executionCompanyId = formData.get("execution_company_id") as string;
  const airlineId = formData.get("airline_id") as string;
  const executionCost = parseFloat((formData.get("execution_cost") as string) || "0");
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!requestId) throw new Error("يجب اختيار الطلب");
  if (!executionCompanyId) throw new Error("يجب اختيار شركة التنفيذ");
  if (!airlineId) throw new Error("يجب اختيار الناقل");
  if (!Number.isFinite(executionCost) || executionCost <= 0) {
    throw new Error("يجب إدخال سعر صحيح");
  }

  await prisma.execution_offers.create({
    data: {
      request_id: BigInt(requestId),
      execution_company_id: BigInt(executionCompanyId),
      airline_id: BigInt(airlineId),
      offer_type: "economy",
      execution_cost: executionCost,
      notes,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/execution-offers");
  return { success: true };
}
