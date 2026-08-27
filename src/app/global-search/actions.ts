"use server";

import { prisma } from "@/lib/prisma";

// Global search: finds a customer by phone (or name) and/or a booking by its
// booking reference. Returns navigation targets for the top search bar.
export async function globalSearch(query: string) {
  const q = query.trim();
  if (!q) return { customers: [], bookings: [] };

  const phoneDigits = q.replace(/[^0-9]/g, "");

  const customers = await prisma.customers.findMany({
    where: {
      OR: [
        {
          phone: {
            ...(phoneDigits
              ? { startsWith: phoneDigits }
              : { contains: q, mode: "insensitive" as const }),
          },
        },
        { name: { contains: q, mode: "insensitive" as const } },
      ],
    },
    select: { id: true, name: true, phone: true },
    take: 8,
  });

  const bookings = await prisma.bookings.findMany({
    where: {
      OR: [
        { booking_reference: { contains: q, mode: "insensitive" as const } },
        ...(phoneDigits
          ? [{ customer: { phone: { startsWith: phoneDigits } } }]
          : []),
      ],
    },
    select: {
      id: true,
      booking_reference: true,
      customer: { select: { id: true, name: true } },
    },
    take: 8,
  });

  return {
    customers: customers.map((c) => ({ id: String(c.id), name: c.name, phone: c.phone })),
    bookings: bookings.map((b) => ({
      id: String(b.id),
      booking_reference: b.booking_reference,
      customerName: b.customer?.name ?? null,
    })),
  };
}
