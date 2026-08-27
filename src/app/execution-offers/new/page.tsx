import { prisma } from "@/lib/prisma";
import { OfferForm } from "./offer-form";

export const dynamic = "force-dynamic";

export default async function NewExecutionOfferPage() {
  const [requests, executionCompanies, airlines] = await Promise.all([
    prisma.booking_requests.findMany({
      where: {
        status: { in: ["NEW", "WAITING_FOR_OFFERS"] },
      },
      include: { customer: true },
      orderBy: { created_at: "desc" },
    }),
    prisma.execution_companies.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.airlines.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedRequests = requests.map((r) => ({
    id: String(r.id),
    origin: r.origin,
    destination: r.destination,
    trip_type: r.trip_type,
    depart_date: r.depart_date.toISOString(),
    return_date: r.return_date?.toISOString() ?? null,
    passengers_count: r.passengers_count,
    status: r.status,
    customer_name: r.customer.name,
  }));

  const serializedCompanies = executionCompanies.map((c) => ({
    id: String(c.id),
    name: c.name,
  }));

  const serializedAirlines = airlines.map((a) => ({
    id: String(a.id),
    name: a.name,
    code: a.code,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">إضافة عرض تنفيذ جديد</h1>
      <OfferForm
        requests={serializedRequests}
        executionCompanies={serializedCompanies}
        airlines={serializedAirlines}
      />
    </div>
  );
}
