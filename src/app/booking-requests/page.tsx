import { prisma } from "@/lib/prisma";
import { BookingRequestsClient } from "./booking-requests-client";

export const dynamic = "force-dynamic";

export default async function BookingRequestsPage() {
  const requests = await prisma.booking_requests.findMany({
    include: {
      customer: true,
    },
    orderBy: { created_at: "desc" },
  });

  return <BookingRequestsClient requests={requests} />;
}
