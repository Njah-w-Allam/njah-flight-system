import { prisma } from "@/lib/prisma";
import { serializeDecimal } from "@/lib/serialize";
import { ExecutionCompaniesClient } from "./execution-companies-client";

export const dynamic = "force-dynamic";

export default async function ExecutionCompaniesPage() {
  const companies = await prisma.execution_companies.findMany({
    include: {
      _count: {
        select: {
          execution_offers: true,
          bookings: true,
          execution_payments: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  return <ExecutionCompaniesClient companies={serializeDecimal(companies)} />;
}
