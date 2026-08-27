import { prisma } from "@/lib/prisma";
import { serializeDecimal } from "@/lib/serialize";
import { CustomersClient } from "./customers-client";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await prisma.customers.findMany({
    include: {
      _count: {
        select: {
          bookings: true,
          customer_payments: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  return <CustomersClient customers={serializeDecimal(customers)} />;
}
