"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createPassenger(formData: FormData) {
  const bookingId = BigInt(formData.get("booking_id") as string);
  const name = formData.get("name") as string;
  const passportNumber = (formData.get("passport_number") as string) || null;
  const nationality = (formData.get("nationality") as string) || null;
  const dateOfBirthRaw = formData.get("date_of_birth") as string | null;
  const notes = (formData.get("notes") as string) || null;

  if (!name || name.trim().length === 0) {
    throw new Error("اسم المسافر مطلوب");
  }

  if (!formData.get("booking_id")) {
    throw new Error("رقم الحجز مطلوب");
  }

  const dateOfBirth = dateOfBirthRaw ? new Date(dateOfBirthRaw) : null;

  await prisma.passengers.create({
    data: {
      booking_id: bookingId,
      name: name.trim(),
      passport_number: passportNumber?.trim() || null,
      nationality: nationality?.trim() || null,
      date_of_birth: dateOfBirth,
      notes: notes?.trim() || null,
    },
  });

  revalidatePath("/passengers");
}

export async function deletePassenger(id: bigint) {
  await prisma.passengers.delete({
    where: { id },
  });

  revalidatePath("/passengers");
}
