import { prisma } from "@/lib/prisma";
import { serializeDecimal } from "@/lib/serialize";
import { notFound } from "next/navigation";
import { CustomerDetailClient } from "./customer-detail-client";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customerId = BigInt(id);

  const customer = await prisma.customers.findUnique({
    where: { id: customerId },
    include: {
      bookings: {
        include: {
          selected_offer: {
            include: { airline: true },
          },
          execution_company: true,
          flight_segments: {
            orderBy: { segment_order: "asc" },
            take: 1,
          },
          tickets: true,
        },
        orderBy: { created_at: "desc" },
      },
      customer_payments: {
        include: {
          booking: {
            select: {
              id: true,
              booking_reference: true,
            },
          },
        },
        orderBy: { payment_date: "desc" },
      },
    },
  });

  if (!customer) {
    notFound();
  }

  return <CustomerDetailClient customer={serializeDecimal(customer)} />;
}
