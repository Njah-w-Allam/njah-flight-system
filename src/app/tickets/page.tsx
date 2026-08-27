import { prisma } from "@/lib/prisma";
import { TicketsClient } from "./tickets-client";

export const dynamic = "force-dynamic";

export default async function TicketsPage() {
  const [tickets, airlines, bookings] = await Promise.all([
    prisma.tickets.findMany({
      include: {
        booking: {
          select: {
            id: true,
            booking_reference: true,
            customer: {
              select: { id: true, name: true },
            },
          },
        },
        airline: {
          select: { id: true, name: true, code: true },
        },
        ticket_passengers: {
          include: {
            passenger: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { id: "desc" },
    }),
    prisma.airlines.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
    prisma.bookings.findMany({
      select: { id: true, booking_reference: true },
      orderBy: { id: "desc" },
    }),
  ]);

  return (
    <TicketsClient
      tickets={tickets}
      airlines={airlines}
      bookings={bookings}
    />
  );
}
