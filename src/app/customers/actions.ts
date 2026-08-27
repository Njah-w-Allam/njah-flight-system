"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createCustomer(formData: FormData) {
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const address = (formData.get("address") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!name || name.trim().length === 0) {
    throw new Error("اسم العميل مطلوب");
  }

  if (!phone || phone.trim().length === 0) {
    throw new Error("رقم الهاتف مطلوب");
  }

  await prisma.customers.create({
    data: {
      name: name.trim(),
      phone: phone.trim(),
      address: address?.trim() || null,
      notes: notes?.trim() || null,
    },
  });

  revalidatePath("/customers");
}
