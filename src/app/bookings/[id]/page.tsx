import { prisma } from "@/lib/prisma";
import { serializeDecimal } from "@/lib/serialize";
import { notFound } from "next/navigation";
import { BookingDetailClient } from "./booking-detail-client";

export const dynamic = "force-dynamic";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bookingId = BigInt(id);

  const booking = await prisma.bookings.findUnique({
    where: { id: bookingId },
    include: {
      customer: true,
      execution_company: true,
      selected_offer: {
        include: { airline: true, execution_company: true },
      },
      request: true,
      tickets: {
        include: { airline: true, refunds: true },
      },
      passengers: true,
      flight_segments: {
        include: { airline: true },
        orderBy: { segment_order: "asc" },
      },
      price_history: {
        orderBy: { changed_at: "desc" },
      },
      customer_payments: {
        include: { customer: true },
        orderBy: { payment_date: "desc" },
      },
      execution_payments: {
        include: { execution_company: true },
        orderBy: { payment_date: "desc" },
      },
      alerts: {
        where: { status: "open" },
        orderBy: { created_at: "desc" },
      },
    },
  });

  if (!booking) {
    notFound();
  }

  return <BookingDetailClient booking={serializeDecimal(booking)} />;
}
