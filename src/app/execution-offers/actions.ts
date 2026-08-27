"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createExecutionOffer(data: {
  request_id: string;
  execution_company_id: string;
  airline_id: string;
  offer_type: string;
  execution_cost: number;
  flight_details?: string;
  ticketing_deadline?: string;
  payment_deadline?: string;
  notes?: string;
}) {
  const offer = await prisma.execution_offers.create({
    data: {
      request_id: BigInt(data.request_id),
      execution_company_id: BigInt(data.execution_company_id),
      airline_id: BigInt(data.airline_id),
      offer_type: data.offer_type as any,
      execution_cost: data.execution_cost,
      flight_details: data.flight_details || null,
      ticketing_deadline: data.ticketing_deadline
        ? new Date(data.ticketing_deadline)
        : null,
      payment_deadline: data.payment_deadline
        ? new Date(data.payment_deadline)
        : null,
      notes: data.notes || null,
    },
  });

  revalidatePath("/execution-offers");
  return { success: true, id: String(offer.id) };
}

export async function rejectOffer(id: string) {
  await prisma.execution_offers.update({
    where: { id: BigInt(id) },
    data: { status: "rejected" },
  });

  revalidatePath("/execution-offers");
}

export async function selectOffer(offerId: string) {
  const offer = await prisma.execution_offers.findUnique({
    where: { id: BigInt(offerId) },
    include: { request: true },
  });

  if (!offer) throw new Error("العرض غير موجود");

  const cost = Number(offer.execution_cost);

  await prisma.$transaction(async (tx) => {
    await tx.execution_offers.updateMany({
      where: {
        request_id: offer.request_id,
        id: { not: offer.id },
        status: "received",
      },
      data: { status: "rejected" },
    });

    await tx.bookings.create({
      data: {
        request_id: offer.request_id,
        customer_id: offer.request.customer_id,
        selected_offer_id: offer.id,
        execution_company_id: offer.execution_company_id,
        depart_date: offer.request.depart_date,
        return_date: offer.request.return_date,
        current_purchase_price: cost,
        current_selling_price: 0,
        current_profit: -cost,
        currency: offer.currency,
        booking_status: "NEW",
      },
    });

    await tx.booking_requests.update({
      where: { id: offer.request_id },
      data: { status: "OFFER_SELECTED" },
    });
  });

  revalidatePath("/execution-offers");
  revalidatePath("/bookings");
}

export async function createAirline(name: string, code?: string) {
  const airline = await prisma.airlines.create({
    data: {
      name,
      code: code || null,
    },
  });

  revalidatePath("/execution-offers/new");
  return { success: true, id: String(airline.id), name: airline.name };
}
