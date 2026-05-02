import { prisma } from "@/lib/db/prisma";

export async function getOrCreateCreditRules() {
  const existing = await prisma.adminCreditRule.findFirst({
    orderBy: {
      createdAt: "asc",
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.adminCreditRule.create({
    data: {},
  });
}

export async function updateCreditRules(
  input: Partial<{
    minAmountPf: number;
    maxAmountPf: number;
    minAmountMei: number;
    maxAmountMei: number;
    minAmountPj: number;
    maxAmountPj: number;
    defaultOperationalAdjustmentPercent: number;
    minScore: number;
    minTerm: number;
    maxTerm: number;
    defaultInterestRate: number;
    analysisMessage: string;
    preApprovedMessage: string;
    refusedMessage: string;
    pendingDocumentsMessage: string;
    releasedMessage: string;
  }>,
) {
  const rules = await getOrCreateCreditRules();
  return prisma.adminCreditRule.update({
    where: { id: rules.id },
    data: input,
  });
}
