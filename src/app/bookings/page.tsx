import { prisma } from "@/lib/prisma";
import { serializeDecimal } from "@/lib/serialize";
import { BookingsClient } from "./bookings-client";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const bookings = await prisma.bookings.findMany({
    include: {
      customer: true,
      execution_company: true,
      selected_offer: {
        include: { airline: true },
      },
      tickets: true,
      flight_segments: {
        orderBy: { segment_order: "asc" },
      },
    },
    orderBy: { created_at: "desc" },
  });

  return <BookingsClient bookings={serializeDecimal(bookings)} />;
}
