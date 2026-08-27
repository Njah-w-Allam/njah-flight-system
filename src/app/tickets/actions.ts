"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createTicket(formData: FormData) {
  const bookingIdRaw = formData.get("booking_id") as string;
  const airlineIdRaw = formData.get("airline_id") as string;

  if (!bookingIdRaw) {
    throw new Error("رقم الحجز مطلوب");
  }

  if (!airlineIdRaw) {
    throw new Error("يجب اختيار شركة الطيران");
  }

  const bookingId = BigInt(bookingIdRaw);
  const airlineId = BigInt(airlineIdRaw);
  const ticketNumber = (formData.get("ticket_number") as string) || null;
  const pnr = (formData.get("pnr") as string) || null;
  const ticketPriceRaw = formData.get("ticket_price") as string;
  const notes = (formData.get("notes") as string) || null;
  const passengerIds = formData.getAll("passenger_ids") as string[];

  const ticketPrice = ticketPriceRaw ? parseFloat(ticketPriceRaw) : 0;

  const ticket = await prisma.tickets.create({
    data: {
      booking_id: bookingId,
      airline_id: airlineId,
      ticket_number: ticketNumber?.trim() || null,
      pnr: pnr?.trim() || null,
      ticket_price: ticketPrice,
      notes: notes?.trim() || null,
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

  revalidatePath("/tickets");
}

export async function issueTicket(id: bigint) {
  await prisma.tickets.update({
    where: { id },
    data: {
      status: "issued",
      issue_date: new Date(),
    },
  });

  revalidatePath("/tickets");
  revalidatePath("/bookings");
}

export async function cancelTicket(id: bigint) {
  await prisma.tickets.update({
    where: { id },
    data: {
      status: "cancelled",
    },
  });

  revalidatePath("/tickets");
  revalidatePath("/bookings");
}

export async function linkPassengerToTicket(
  ticketId: bigint,
  passengerId: bigint
) {
  await prisma.ticket_passengers.create({
    data: {
      ticket_id: ticketId,
      passenger_id: passengerId,
    },
  });

  revalidatePath("/tickets");
}
