import { prisma } from "@/lib/prisma";
import { UpcomingTicketsClient } from "./upcoming-tickets-client";

export const dynamic = "force-dynamic";

export default async function UpcomingTicketsPage() {
  const now = new Date();
  const tomorrowEnd = new Date(now);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

  const tickets = await prisma.$queryRaw`
    SELECT
      t.id as ticket_id,
      t.ticket_number,
      t.pnr,
      t.status as ticket_status,
      t.ticket_price,
      t.currency,
      a.name as airline_name,
      a.code as airline_code,
      fs.departure_at,
      fs.arrival_at,
      fs.from_location,
      fs.to_location,
      fs.flight_number,
      fs.terminal,
      fs.class,
      fs.baggage,
      c.name as customer_name,
      c.phone as customer_phone,
      c.id as customer_id,
      b.id as booking_id,
      b.booking_status,
      b.current_selling_price,
      b.current_purchase_price
    FROM tickets t
    JOIN bookings b ON b.id = t.booking_id
    JOIN customers c ON c.id = b.customer_id
    JOIN airlines a ON a.id = t.airline_id
    JOIN flight_segments fs ON fs.booking_id = b.id
    WHERE fs.departure_at BETWEEN ${now} AND ${tomorrowEnd}
      AND t.status != 'cancelled'
    ORDER BY fs.departure_at ASC
  `;

  return <UpcomingTicketsClient tickets={tickets as any[]} />;
}
