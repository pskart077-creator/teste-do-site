import { formatCurrencyBrl } from "@/lib/credit/helpers";

export const INITIAL_CREDIT_LIMIT_MIN = 400;
export const INITIAL_CREDIT_LIMIT_MAX = 4000;

export type InitialCreditLimitInput = {
  monthlyIncome: number;
  currentMonthlyDebt?: number;
};

export type InitialCreditLimitResult = {
  monthlyIncome: number;
  currentMonthlyDebt: number;
  incomeBasedLimit: number;
  marginBasedLimit: number;
  suggestedLimit: number;
  formattedSuggestedLimit: string;
};

function toCurrency(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Number(value.toFixed(2));
}

function toPositiveCurrency(value: number | undefined) {
  return Math.max(0, toCurrency(Number(value ?? 0)));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundDownToNearestFifty(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.floor(value / 50) * 50;
}

function calculateIncomeBasedLimit(monthlyIncome: number) {
  if (monthlyIncome <= 1800) {
    return INITIAL_CREDIT_LIMIT_MIN;
  }

  if (monthlyIncome <= 3000) {
    return monthlyIncome * 0.35;
  }

  if (monthlyIncome <= 5000) {
    return monthlyIncome * 0.4;
  }

  return monthlyIncome * 0.5;
}

export function calculateInitialCreditLimit(input: InitialCreditLimitInput): InitialCreditLimitResult {
  const monthlyIncome = toPositiveCurrency(input.monthlyIncome);
  const currentMonthlyDebt = toPositiveCurrency(input.currentMonthlyDebt);
  const availableMonthlyMargin = toCurrency(Math.max(0, monthlyIncome * 0.25 - currentMonthlyDebt));
  const incomeBasedLimit = toCurrency(calculateIncomeBasedLimit(monthlyIncome));
  const marginBasedLimit = availableMonthlyMargin > 0
    ? toCurrency(availableMonthlyMargin * 3)
    : INITIAL_CREDIT_LIMIT_MIN;
  const rawLimit = Math.min(incomeBasedLimit, marginBasedLimit, INITIAL_CREDIT_LIMIT_MAX);
  const roundedLimit = roundDownToNearestFifty(rawLimit);
  const suggestedLimit = toCurrency(
    clamp(roundedLimit || INITIAL_CREDIT_LIMIT_MIN, INITIAL_CREDIT_LIMIT_MIN, INITIAL_CREDIT_LIMIT_MAX),
  );

  return {
    monthlyIncome,
    currentMonthlyDebt,
    incomeBasedLimit,
    marginBasedLimit,
    suggestedLimit,
    formattedSuggestedLimit: formatCurrencyBrl(suggestedLimit),
  };
}
