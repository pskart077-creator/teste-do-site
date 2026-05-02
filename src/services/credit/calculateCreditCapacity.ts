import { money } from "@/lib/credit/helpers";

export const CREDIT_MAX_INSTALLMENT_PERCENT = 10;

export type CreditCapacityResult = {
  monthlyIncome: number;
  desiredTerm: number;
  maxInstallmentAmount: number;
  maxAffordableAmount: number;
  requestedInstallmentAmount: number;
  approvedInstallmentAmount: number;
  approvedAmount: number;
  incomeCapacityApplied: boolean;
};

export function calculateCreditCapacity(input: {
  requestedAmount: number;
  desiredTerm: number;
  monthlyIncome: number;
}) {
  const requestedAmount = money(input.requestedAmount);
  const monthlyIncome = money(input.monthlyIncome);
  const desiredTerm = Math.max(1, Math.floor(Number(input.desiredTerm) || 1));
  const maxInstallmentAmount = money(monthlyIncome * (CREDIT_MAX_INSTALLMENT_PERCENT / 100));
  const maxAffordableAmount = money(maxInstallmentAmount * desiredTerm);
  const approvedAmount = money(Math.min(requestedAmount, maxAffordableAmount));
  const requestedInstallmentAmount = money(requestedAmount / desiredTerm);
  const approvedInstallmentAmount = money(approvedAmount / desiredTerm);

  return {
    monthlyIncome,
    desiredTerm,
    maxInstallmentAmount,
    maxAffordableAmount,
    requestedInstallmentAmount,
    approvedInstallmentAmount,
    approvedAmount,
    incomeCapacityApplied: approvedAmount < requestedAmount,
  } satisfies CreditCapacityResult;
}
