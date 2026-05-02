import { Prisma } from "@prisma/client";
import type { PixChargeType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getPixProvider } from "@/services/credit/pix/getPixProvider";

export async function createPixChargeForContract(input: {
  applicationId: string;
  contractId?: string;
  amount: number;
  description: string;
  type: PixChargeType;
  metadata?: Record<string, unknown>;
}) {
  const provider = getPixProvider();
  const created = await provider.createCharge({
    amount: input.amount,
    description: input.description,
    type: input.type,
    metadata: input.metadata,
  });

  return prisma.pixCharge.create({
    data: {
      applicationId: input.applicationId,
      contractId: input.contractId ?? null,
      provider: created.provider,
      type: input.type,
      status: "PENDING",
      amount: input.amount,
      description: input.description,
      externalId: created.externalId,
      qrCode: created.qrCode,
      copyPaste: created.copyPaste,
      expiresAt: created.expiresAt,
      metadata: (created.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      events: {
        create: {
          eventType: "CHARGE_CREATED",
          status: "PENDING",
          payload: (created.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        },
      },
    },
  });
}
