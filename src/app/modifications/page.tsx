import { prisma } from "@/lib/prisma";
import { serializeDecimal } from "@/lib/serialize";
import { ModificationsClient } from "./modifications-client";

export const dynamic = "force-dynamic";

export default async function ModificationsPage() {
  const modifications = await prisma.modifications.findMany({
    include: {
      ticket: {
        include: {
          booking: {
            include: { customer: true },
          },
        },
      },
    },
    orderBy: { modification_date: "desc" },
  });

  const refunds = await prisma.refunds.findMany({
    include: {
      ticket: {
        include: {
          booking: {
            include: { customer: true },
          },
        },
      },
    },
    orderBy: { id: "desc" },
  });

  const tickets = await prisma.tickets.findMany({
    where: {
      status: { in: ["issued", "modified", "refund_pending", "partially_refunded"] },
    },
    include: {
      booking: {
        include: { customer: true },
      },
    },
    orderBy: { id: "desc" },
  });

  return (
    <ModificationsClient
      modifications={serializeDecimal(modifications)}
      refunds={serializeDecimal(refunds)}
      tickets={serializeDecimal(tickets)}
    />
  );
}
