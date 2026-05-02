import type { CreditApplicationStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export async function updateApplicationStatus(input: {
  applicationId: string;
  toStatus: CreditApplicationStatus;
  actorType?: string;
  actorId?: string;
  note?: string;
}) {
  const current = await prisma.creditApplication.findUnique({
    where: { id: input.applicationId },
    select: { status: true },
  });

  if (!current) {
    throw new Error("Solicitação não encontrada.");
  }

  const updated = await prisma.creditApplication.update({
    where: { id: input.applicationId },
    data: {
      status: input.toStatus,
      submittedAt: input.toStatus === "SUBMITTED" ? new Date() : undefined,
      releasedAt: input.toStatus === "CREDIT_RELEASED" ? new Date() : undefined,
      history: {
        create: {
          fromStatus: current.status,
          toStatus: input.toStatus,
          actorType: input.actorType ?? null,
          actorId: input.actorId ?? null,
          note: input.note ?? null,
        },
      },
    },
  });

  return updated;
}
