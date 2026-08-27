import { prisma } from "@/lib/prisma";
import { serializeDecimal } from "@/lib/serialize";
import { notFound } from "next/navigation";
import { CompanyDetailClient } from "./company-detail-client";

export const dynamic = "force-dynamic";

export default async function ExecutionCompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = BigInt(id);

  const company = await prisma.execution_companies.findUnique({
    where: { id: companyId },
    include: {
      execution_offers: {
        include: { airline: true, request: { include: { customer: true } } },
        orderBy: { created_at: "desc" },
      },
      bookings: {
        include: {
          customer: true,
          selected_offer: { include: { airline: true } },
          tickets: true,
          flight_segments: { orderBy: { segment_order: "asc" } },
        },
        orderBy: { created_at: "desc" },
      },
      execution_payments: {
        include: { booking: true },
        orderBy: { payment_date: "desc" },
      },
    },
  });

  if (!company) {
    notFound();
  }

  return <CompanyDetailClient company={serializeDecimal(company)} />;
}
