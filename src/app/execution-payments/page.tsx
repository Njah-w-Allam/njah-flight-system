import { prisma } from "@/lib/prisma";
import { ExecutionPaymentsClient } from "./execution-payments-client";

export const dynamic = "force-dynamic";

export default async function ExecutionPaymentsPage() {
  const payments = await prisma.execution_payments.findMany({
    include: {
      execution_company: true,
      booking: true,
    },
    orderBy: { created_at: "desc" },
  });

  const bookings = await prisma.bookings.findMany({
    include: {
      execution_company: true,
    },
    orderBy: { created_at: "desc" },
  });

  return <ExecutionPaymentsClient payments={payments} bookings={bookings} />;
}
