"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createExecutionCompany(formData: FormData) {
  const name = formData.get("name") as string;
  const contactPerson = formData.get("contact_person") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;

  if (!name || name.trim() === "") {
    throw new Error("اسم الشركة مطلوب");
  }

  await prisma.execution_companies.create({
    data: {
      name: name.trim(),
      contact_person: contactPerson?.trim() || null,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
    },
  });

  revalidatePath("/execution-companies");
}
