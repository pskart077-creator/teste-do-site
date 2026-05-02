import type { CreditSimulationResult } from "@/lib/credit/types";
import { money } from "@/lib/credit/helpers";
import { calculateCreditCapacity } from "@/services/credit/calculateCreditCapacity";

export function calculateCreditSimulation(input: {
  requestedAmount: number;
  operationalAdjustmentPercent: number;
  desiredTerm?: number;
  monthlyIncome?: number;
}): CreditSimulationResult {
  const requestedAmount = money(input.requestedAmount);
  const operationalAdjustmentPercent = money(input.operationalAdjustmentPercent);
  const hasCapacityRule =
    Number(input.monthlyIncome) > 0 && Number(input.desiredTerm) > 0;
  const capacity = hasCapacityRule
    ? calculateCreditCapacity({
        requestedAmount,
        desiredTerm: input.desiredTerm ?? 1,
        monthlyIncome: input.monthlyIncome ?? 0,
      })
    : {
        monthlyIncome: 0,
        desiredTerm: Math.max(1, Math.floor(Number(input.desiredTerm) || 1)),
        maxInstallmentAmount: 0,
        maxAffordableAmount: requestedAmount,
        requestedInstallmentAmount: money(requestedAmount / Math.max(1, Math.floor(Number(input.desiredTerm) || 1))),
        approvedInstallmentAmount: money(requestedAmount / Math.max(1, Math.floor(Number(input.desiredTerm) || 1))),
        approvedAmount: requestedAmount,
        incomeCapacityApplied: false,
      };
  const operationalAdjustmentAmount = money(
    capacity.approvedAmount * (operationalAdjustmentPercent / 100),
  );
  const estimatedNetAmount = money(capacity.approvedAmount - operationalAdjustmentAmount);

  return {
    requestedAmount,
    approvedAmount: capacity.approvedAmount,
    operationalAdjustmentPercent,
    operationalAdjustmentAmount,
    estimatedNetAmount,
    approvedEstimatedNetAmount: estimatedNetAmount,
    monthlyIncome: capacity.monthlyIncome,
    desiredTerm: capacity.desiredTerm,
    maxInstallmentAmount: capacity.maxInstallmentAmount,
    maxAffordableAmount: capacity.maxAffordableAmount,
    requestedInstallmentAmount: capacity.requestedInstallmentAmount,
    approvedInstallmentAmount: capacity.approvedInstallmentAmount,
    incomeCapacityApplied: capacity.incomeCapacityApplied,
  };
}
