import { prisma } from "@/lib/prisma";
import { PassengersClient } from "./passengers-client";

export const dynamic = "force-dynamic";

export default async function PassengersPage() {
  const [passengers, bookings] = await Promise.all([
    prisma.passengers.findMany({
      include: {
        booking: {
          select: { id: true, booking_reference: true },
        },
        ticket_passengers: {
          include: {
            ticket: {
              select: { id: true, ticket_number: true, status: true },
            },
          },
        },
      },
      orderBy: { id: "desc" },
    }),
    prisma.bookings.findMany({
      select: { id: true, booking_reference: true },
      orderBy: { id: "desc" },
    }),
  ]);

  return <PassengersClient passengers={passengers} bookings={bookings} />;
}
