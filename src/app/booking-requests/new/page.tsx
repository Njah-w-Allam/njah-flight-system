import { prisma } from "@/lib/prisma";
import { BookingRequestForm } from "./booking-request-form";

export const dynamic = "force-dynamic";

export default async function NewBookingRequestPage() {
  const customers = await prisma.customers.findMany({
    select: { id: true, name: true, phone: true },
    orderBy: { name: "asc" },
  });

  return <BookingRequestForm customers={customers} />;
}
