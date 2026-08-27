import { prisma } from "@/lib/prisma";
import { ExecutionOffersClient } from "./execution-offers-client";

export const dynamic = "force-dynamic";

export default async function ExecutionOffersPage() {
  const offers = await prisma.execution_offers.findMany({
    include: {
      request: {
        include: { customer: true },
      },
      execution_company: true,
      airline: true,
    },
    orderBy: { created_at: "desc" },
  });

  const serialized = offers.map((o) => ({
    ...o,
    id: String(o.id),
    request_id: String(o.request_id),
    execution_company_id: String(o.execution_company_id),
    airline_id: String(o.airline_id),
    execution_cost: Number(o.execution_cost),
    request: {
      ...o.request,
      id: String(o.request_id),
      customer_id: String(o.request.customer_id),
      depart_date: o.request.depart_date.toISOString(),
      return_date: o.request.return_date?.toISOString() ?? null,
      created_at: o.request.created_at.toISOString(),
      updated_at: o.request.updated_at.toISOString(),
      customer: {
        ...o.request.customer,
        id: String(o.request.customer.id),
        balance: Number(o.request.customer.balance),
        created_at: o.request.customer.created_at.toISOString(),
        updated_at: o.request.customer.updated_at.toISOString(),
      },
    },
    execution_company: {
      ...o.execution_company,
      id: String(o.execution_company.id),
      balance: Number(o.execution_company.balance),
    },
    airline: {
      ...o.airline,
      id: String(o.airline.id),
    },
    received_at: o.received_at?.toISOString() ?? null,
    ticketing_deadline: o.ticketing_deadline?.toISOString() ?? null,
    payment_deadline: o.payment_deadline?.toISOString() ?? null,
    created_at: o.created_at.toISOString(),
  }));

  return <ExecutionOffersClient offers={serialized} />;
}
