import type { CreditAnalysis, CreditApplication } from "@prisma/client";
import { calculateCreditSimulation } from "@/services/credit/calculateCreditSimulation";

function calculateInstallmentAmount(principal: number, monthlyRatePercent: number, term: number) {
  const monthlyRate = monthlyRatePercent / 100;
  if (monthlyRate <= 0) {
    return principal / Math.max(1, term);
  }
  const factor = Math.pow(1 + monthlyRate, term);
  return principal * ((monthlyRate * factor) / (factor - 1));
}

export function generateProposal(input: {
  application: Pick<
    CreditApplication,
    "requestedAmount" | "operationalAdjustmentPercent" | "desiredTerm" | "desiredDueDay"
  >;
  analysis: Pick<CreditAnalysis, "suggestedAmount" | "suggestedTerm">;
  defaultInterestRate: number;
}) {
  const baseAmount =
    input.analysis.suggestedAmount > 0
      ? input.analysis.suggestedAmount
      : input.application.requestedAmount;
  const term =
    input.analysis.suggestedTerm > 0
      ? input.analysis.suggestedTerm
      : input.application.desiredTerm;
  const interestRate = Number(input.defaultInterestRate.toFixed(2));

  const simulation = calculateCreditSimulation({
    requestedAmount: baseAmount,
    operationalAdjustmentPercent: input.application.operationalAdjustmentPercent,
  });

  const installmentAmount = Number(
    calculateInstallmentAmount(simulation.estimatedNetAmount, interestRate, term).toFixed(2),
  );
  const cet = Number((interestRate + 0.65).toFixed(2));
  const iofAmount = Number((simulation.estimatedNetAmount * 0.011).toFixed(2));

  return {
    requestedAmount: input.application.requestedAmount,
    suggestedAmount: baseAmount,
    estimatedNetAmount: simulation.estimatedNetAmount,
    operationalAdjustmentPercent: simulation.operationalAdjustmentPercent,
    operationalAdjustmentAmount: simulation.operationalAdjustmentAmount,
    term,
    installmentAmount,
    interestRate,
    cet,
    iofAmount,
    dueDay: input.application.desiredDueDay ?? 10,
  };
}
