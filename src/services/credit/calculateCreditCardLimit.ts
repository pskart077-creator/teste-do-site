import { formatCurrencyBrl as formatCurrencyBrlHelper } from "@/lib/credit/helpers";
import {
  INITIAL_CREDIT_LIMIT_MAX,
  INITIAL_CREDIT_LIMIT_MIN,
  calculateInitialCreditLimit,
} from "@/services/credit/calculateInitialCreditLimit";

export type CreditCardRiskProfile = "LOW" | "MEDIUM" | "HIGH" | "RESTRICTED";

export type CreditCardLimitInput = {
  monthlyIncome: number;
  currentMonthlyDebt?: number;
  riskProfile?: CreditCardRiskProfile;
};

export type CreditCardLimitResult = {
  monthlyIncome: number;
  currentMonthlyDebt: number;
  riskProfile: CreditCardRiskProfile;
  commitmentRate: number;
  availableMonthlyMargin: number;
  incomeBasedLimit: number;
  marginBasedLimit: number;
  suggestedLimit: number;
  formattedSuggestedLimit: string;
  explanation: string;
};

type CreditCardLimitRules = {
  commitmentRate: number;
  incomeMultiplier: number;
  marginMultiplier: number;
  minLimit: number;
  maxLimit: number;
};

const CREDIT_CARD_LIMIT_RULES: Record<CreditCardRiskProfile, CreditCardLimitRules> = {
  LOW: {
    commitmentRate: 0.3,
    incomeMultiplier: 0.5,
    marginMultiplier: 3,
    minLimit: INITIAL_CREDIT_LIMIT_MIN,
    maxLimit: INITIAL_CREDIT_LIMIT_MAX,
  },
  MEDIUM: {
    commitmentRate: 0.25,
    incomeMultiplier: 0.45,
    marginMultiplier: 2.5,
    minLimit: INITIAL_CREDIT_LIMIT_MIN,
    maxLimit: INITIAL_CREDIT_LIMIT_MAX,
  },
  HIGH: {
    commitmentRate: 0.15,
    incomeMultiplier: 0.3,
    marginMultiplier: 1.5,
    minLimit: INITIAL_CREDIT_LIMIT_MIN,
    maxLimit: 2000,
  },
  RESTRICTED: {
    commitmentRate: 0.08,
    incomeMultiplier: 0.15,
    marginMultiplier: 1,
    minLimit: INITIAL_CREDIT_LIMIT_MIN,
    maxLimit: 1000,
  },
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

function roundDownToNearestFifty(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.floor(value / 50) * 50;
}

export function formatCurrencyBrl(value: number) {
  return formatCurrencyBrlHelper(value);
}

export function createCreditLimitExplanation(result: CreditCardLimitResult) {
  return `Com base na renda mensal informada, na margem disponível e no perfil de análise, o limite sugerido para este cliente é de ${result.formattedSuggestedLimit}.`;
}

export function calculateCreditCardLimit(input: CreditCardLimitInput): CreditCardLimitResult {
  const monthlyIncome = toPositiveCurrency(input.monthlyIncome);
  const currentMonthlyDebt = toPositiveCurrency(input.currentMonthlyDebt);
  const riskProfile = input.riskProfile ?? "LOW";
  const rules = CREDIT_CARD_LIMIT_RULES[riskProfile];

  const availableMonthlyMargin = toCurrency(monthlyIncome * rules.commitmentRate - currentMonthlyDebt);
  const incomeBasedLimit = toCurrency(monthlyIncome * rules.incomeMultiplier);
  const marginBasedLimit = toCurrency(availableMonthlyMargin * rules.marginMultiplier);
  const initialLimit = calculateInitialCreditLimit({
    monthlyIncome,
    currentMonthlyDebt,
  });

  const rawSuggestedLimit =
    availableMonthlyMargin < 0
      ? rules.minLimit
      : Math.min(initialLimit.suggestedLimit, incomeBasedLimit, marginBasedLimit, rules.maxLimit);

  const boundedSuggestedLimit = Math.min(
    rules.maxLimit,
    Math.max(rawSuggestedLimit, rules.minLimit),
  );

  const roundedSuggestedLimit = roundDownToNearestFifty(boundedSuggestedLimit);
  const suggestedLimit = toCurrency(
    roundedSuggestedLimit < rules.minLimit ? rules.minLimit : roundedSuggestedLimit,
  );

  const baseResult = {
    monthlyIncome,
    currentMonthlyDebt,
    riskProfile,
    commitmentRate: rules.commitmentRate,
    availableMonthlyMargin,
    incomeBasedLimit,
    marginBasedLimit,
    suggestedLimit,
    formattedSuggestedLimit: formatCurrencyBrl(suggestedLimit),
    explanation: "",
  } satisfies CreditCardLimitResult;

  return {
    ...baseResult,
    explanation: createCreditLimitExplanation(baseResult),
  };
}
