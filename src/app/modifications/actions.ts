"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  responsible_party_enum,
  refund_status_enum,
} from "@prisma/client";
import { InputJsonValue } from "@prisma/client/runtime/library";

export async function createRefund(
  ticket_id: bigint,
  expected_amount: number,
  responsible_party: responsible_party_enum,
  notes: string | null
) {
  await prisma.refunds.create({
    data: {
      ticket_id,
      expected_amount,
      responsible_party,
      notes: notes?.trim() || null,
    },
  });

  await prisma.tickets.update({
    where: { id: ticket_id },
    data: { status: "refund_pending" },
  });

  revalidatePath("/modifications");
}

export async function processRefund(
  id: bigint,
  actual_amount: number,
  refund_fee: number,
  status: refund_status_enum
) {
  await prisma.refunds.update({
    where: { id },
    data: {
      actual_amount,
      refund_fee,
      status,
      refund_date: new Date(),
    },
  });

  if (status === "processed" || status === "approved") {
    const refund = await prisma.refunds.findUnique({ where: { id } });
    if (refund) {
      await prisma.tickets.update({
        where: { id: refund.ticket_id },
        data: { status: status === "processed" ? "refunded" : "partially_refunded" },
      });
    }
  }

  revalidatePath("/modifications");
}

export async function createModification(
  ticket_id: bigint,
  old_data: InputJsonValue,
  new_data: InputJsonValue,
  fee: number | null,
  paid_by: responsible_party_enum | null,
  notes: string | null
) {
  await prisma.modifications.create({
    data: {
      ticket_id,
      old_data,
      new_data,
      fee: fee ?? undefined,
      paid_by: paid_by ?? undefined,
      notes: notes?.trim() || null,
    },
  });

  await prisma.tickets.update({
    where: { id: ticket_id },
    data: { status: "modified" },
  });

  revalidatePath("/modifications");
}
