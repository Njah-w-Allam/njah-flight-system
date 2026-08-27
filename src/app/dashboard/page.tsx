import { prisma } from "@/lib/prisma";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  const tomorrowEnd = new Date(todayEnd);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

  const [
    todayBookings,
    newBookings,
    upcomingTickets,
    ticketingDeadlines,
    customersInDebt,
    overduePayments,
    executionDue,
    openAlerts,
  ] = await Promise.all([
    prisma.bookings.findMany({
      where: {
        created_at: { gte: todayStart, lt: todayEnd },
      },
      include: { customer: true, execution_company: true },
      orderBy: { created_at: "desc" },
    }),
    prisma.bookings.findMany({
      where: {
        booking_status: "NEW",
      },
      include: { customer: true },
      orderBy: { created_at: "desc" },
      take: 10,
    }),
    prisma.$queryRaw`
      SELECT
        t.id as ticket_id,
        t.ticket_number,
        t.pnr,
        t.status as ticket_status,
        t.ticket_price,
        a.name as airline_name,
        fs.departure_at,
        fs.from_location,
        fs.to_location,
        fs.flight_number,
        c.name as customer_name,
        c.phone as customer_phone,
        b.id as booking_id,
        b.booking_status
      FROM tickets t
      JOIN bookings b ON b.id = t.booking_id
      JOIN customers c ON c.id = b.customer_id
      JOIN airlines a ON a.id = t.airline_id
      JOIN flight_segments fs ON fs.booking_id = b.id
      WHERE fs.departure_at BETWEEN ${now} AND ${tomorrowEnd}
        AND t.status != 'cancelled'
      ORDER BY fs.departure_at ASC
    `,
    prisma.execution_offers.findMany({
      where: {
        ticketing_deadline: { gte: now, lte: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) },
        status: "received",
      },
      include: { execution_company: true, airline: true, request: true },
      orderBy: { ticketing_deadline: "asc" },
    }),
    prisma.customers.findMany({
      where: { balance: { gt: 0 } },
      orderBy: { balance: "desc" },
    }),
    prisma.customer_payments.findMany({
      where: { status: "overdue" },
      include: { customer: true, booking: true },
      orderBy: { payment_date: "desc" },
    }),
    prisma.execution_payments.findMany({
      where: { status: "overdue" },
      include: { execution_company: true, booking: true },
      orderBy: { payment_date: "desc" },
    }),
    prisma.alerts.findMany({
      where: { status: "open" },
      include: { booking: true, customer: true, execution_company: true },
      orderBy: [{ severity: "desc" }, { created_at: "desc" }],
    }),
  ]);

  return (
    <DashboardClient
      todayBookings={todayBookings}
      newBookings={newBookings}
      upcomingTickets={upcomingTickets as any[]}
      ticketingDeadlines={ticketingDeadlines}
      customersInDebt={customersInDebt}
      overduePayments={overduePayments}
      executionDue={executionDue}
      openAlerts={openAlerts}
    />
  );
}
