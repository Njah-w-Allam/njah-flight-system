import { prisma } from "@/lib/prisma";
import { CustomerPaymentsClient } from "./customer-payments-client";

export const dynamic = "force-dynamic";

export default async function CustomerPaymentsPage() {
  const payments = await prisma.customer_payments.findMany({
    include: {
      customer: true,
      booking: true,
    },
    orderBy: { created_at: "desc" },
  });

  const bookings = await prisma.bookings.findMany({
    include: {
      customer: true,
    },
    orderBy: { created_at: "desc" },
  });

  return <CustomerPaymentsClient payments={payments} bookings={bookings} />;
}
