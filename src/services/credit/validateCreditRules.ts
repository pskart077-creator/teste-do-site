import type { AdminCreditRule, CreditProfileType } from "@prisma/client";

export type CreditRuleValidationResult = {
  valid: boolean;
  reasons: string[];
};

export function validateCreditRules(input: {
  profileType: CreditProfileType;
  requestedAmount: number;
  desiredTerm: number;
  rules: AdminCreditRule;
}) {
  const reasons: string[] = [];

  const amount = Number(input.requestedAmount);
  const term = Number(input.desiredTerm);

  if (input.profileType === "PF") {
    if (amount < input.rules.minAmountPf) {
      reasons.push("Valor solicitado abaixo do mínimo permitido para PF.");
    }
    if (amount > input.rules.maxAmountPf) {
      reasons.push("Valor solicitado acima do máximo permitido para PF.");
    }
  }

  if (input.profileType === "MEI") {
    if (amount < input.rules.minAmountMei) {
      reasons.push("Valor solicitado abaixo do mínimo permitido para MEI.");
    }
    if (amount > input.rules.maxAmountMei) {
      reasons.push("Valor solicitado acima do máximo permitido para MEI.");
    }
  }

  if (input.profileType === "PJ") {
    if (amount < input.rules.minAmountPj) {
      reasons.push("Valor solicitado abaixo do mínimo permitido para PJ.");
    }
    if (amount > input.rules.maxAmountPj) {
      reasons.push("Valor solicitado acima do máximo permitido para PJ.");
    }
  }

  if (term < input.rules.minTerm) {
    reasons.push("Prazo solicitado abaixo do mínimo configurado.");
  }
  if (term > input.rules.maxTerm) {
    reasons.push("Prazo solicitado acima do máximo configurado.");
  }

  return {
    valid: reasons.length === 0,
    reasons,
  } satisfies CreditRuleValidationResult;
}
