import { money } from "@/lib/credit/helpers";
import {
  calculateInstallmentWithInterest,
  calculatePrincipalFromInstallment,
  getMarketMonthlyInterestRate,
} from "@/services/credit/calculateInstallmentWithInterest";

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
  const monthlyInterestRatePercent = getMarketMonthlyInterestRate(desiredTerm, 0.35);
  const maxAffordableAmount = calculatePrincipalFromInstallment({
    installmentAmount: maxInstallmentAmount,
    term: desiredTerm,
    monthlyInterestRatePercent,
  });
  const approvedAmount = money(Math.min(requestedAmount, maxAffordableAmount));
  const requestedInstallmentAmount = calculateInstallmentWithInterest({
    principal: requestedAmount,
    term: desiredTerm,
    monthlyInterestRatePercent,
  });
  const approvedInstallmentAmount = calculateInstallmentWithInterest({
    principal: approvedAmount,
    term: desiredTerm,
    monthlyInterestRatePercent,
  });

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
