function money(value: number) {
  return Number(value.toFixed(2));
}

export function getMarketMonthlyInterestRate(term: number, riskAdjustment = 0) {
  const normalizedTerm = Math.max(1, Math.floor(Number(term) || 1));
  const termAdjustment =
    normalizedTerm <= 12
      ? 0
      : normalizedTerm <= 24
        ? 0.15
        : normalizedTerm <= 36
          ? 0.25
          : 0.35;

  return money(6.99 + termAdjustment + riskAdjustment);
}

export function calculateInstallmentWithInterest(input: {
  principal: number;
  term: number;
  monthlyInterestRatePercent?: number;
}) {
  const principal = Math.max(0, Number(input.principal) || 0);
  const term = Math.max(1, Math.floor(Number(input.term) || 1));
  const monthlyRatePercent =
    typeof input.monthlyInterestRatePercent === "number"
      ? input.monthlyInterestRatePercent
      : getMarketMonthlyInterestRate(term);
  const monthlyRate = monthlyRatePercent / 100;

  if (monthlyRate <= 0) {
    return money(principal / term);
  }

  const factor = Math.pow(1 + monthlyRate, term);
  return money(principal * ((monthlyRate * factor) / (factor - 1)));
}

export function calculatePrincipalFromInstallment(input: {
  installmentAmount: number;
  term: number;
  monthlyInterestRatePercent?: number;
}) {
  const installmentAmount = Math.max(0, Number(input.installmentAmount) || 0);
  const term = Math.max(1, Math.floor(Number(input.term) || 1));
  const monthlyRatePercent =
    typeof input.monthlyInterestRatePercent === "number"
      ? input.monthlyInterestRatePercent
      : getMarketMonthlyInterestRate(term);
  const monthlyRate = monthlyRatePercent / 100;

  if (monthlyRate <= 0) {
    return money(installmentAmount * term);
  }

  const factor = Math.pow(1 + monthlyRate, term);
  return money(installmentAmount * ((factor - 1) / (monthlyRate * factor)));
}
