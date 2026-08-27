import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const bookingId = request.nextUrl.searchParams.get("booking_id");

  if (!bookingId) {
    return NextResponse.json(
      { error: "booking_id is required" },
      { status: 400 }
    );
  }

  const passengers = await prisma.passengers.findMany({
    where: { booking_id: BigInt(bookingId) },
    select: { id: true, name: true, booking_id: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    passengers.map((p) => ({
      ...p,
      id: p.id.toString(),
      booking_id: p.booking_id.toString(),
    }))
  );
}
