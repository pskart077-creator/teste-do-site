import { formatCurrencyBrl as formatCurrencyBrlHelper } from "@/lib/credit/helpers";

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
    incomeMultiplier: 0.8,
    marginMultiplier: 3,
    minLimit: 500,
    maxLimit: 5000,
  },
  MEDIUM: {
    commitmentRate: 0.25,
    incomeMultiplier: 0.5,
    marginMultiplier: 2,
    minLimit: 300,
    maxLimit: 3000,
  },
  HIGH: {
    commitmentRate: 0.15,
    incomeMultiplier: 0.3,
    marginMultiplier: 1.5,
    minLimit: 150,
    maxLimit: 1500,
  },
  RESTRICTED: {
    commitmentRate: 0.08,
    incomeMultiplier: 0.15,
    marginMultiplier: 1,
    minLimit: 100,
    maxLimit: 800,
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
  const riskProfile = input.riskProfile ?? "MEDIUM";
  const rules = CREDIT_CARD_LIMIT_RULES[riskProfile];

  const availableMonthlyMargin = toCurrency(monthlyIncome * rules.commitmentRate - currentMonthlyDebt);
  const incomeBasedLimit = toCurrency(monthlyIncome * rules.incomeMultiplier);
  const marginBasedLimit = toCurrency(availableMonthlyMargin * rules.marginMultiplier);

  const rawSuggestedLimit =
    availableMonthlyMargin < 0
      ? rules.minLimit
      : Math.min(incomeBasedLimit, marginBasedLimit, rules.maxLimit);

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
