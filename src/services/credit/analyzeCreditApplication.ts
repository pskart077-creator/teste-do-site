import type { CreditRecommendation, CreditRiskLevel } from "@prisma/client";
import type { CreditAnalysisResult } from "@/lib/credit/types";

type AnalyzeCreditApplicationInput = {
  profileType: "PF" | "MEI" | "PJ";
  requestedAmount: number;
  desiredTerm: number;
  monthlyCapacity: number;
  currentInstallmentsAmount: number;
  hasRestrictions: boolean;
  documentsCount: number;
  requiredDocumentsCount: number;
  hasBankData: boolean;
  operatingMonths: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeCommitment(monthlyCapacity: number, currentInstallmentsAmount: number) {
  if (monthlyCapacity <= 0) {
    return 1;
  }
  return clamp(currentInstallmentsAmount / monthlyCapacity, 0, 1.5);
}

function money(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Number(value.toFixed(2)));
}

export function analyzeCreditApplication(input: AnalyzeCreditApplicationInput): CreditAnalysisResult {
  const reasons: string[] = [];
  let score = 500;
  const shouldEvaluateDocuments = input.requiredDocumentsCount > 0;

  const commitmentRatio = normalizeCommitment(
    input.monthlyCapacity,
    input.currentInstallmentsAmount,
  );
  const docsCoverage = clamp(
    shouldEvaluateDocuments
      ? input.documentsCount / Math.max(1, input.requiredDocumentsCount)
      : 1,
    0,
    1,
  );
  const requestPressure = input.monthlyCapacity > 0
    ? clamp(input.requestedAmount / (input.monthlyCapacity * 12), 0, 2)
    : 2;
  const maxInstallmentAmount = money(input.monthlyCapacity * 0.1);
  const maxAffordableAmount = money(maxInstallmentAmount * Math.max(1, input.desiredTerm));

  score += Math.round(docsCoverage * 220);
  score -= Math.round(commitmentRatio * 180);
  score -= Math.round(requestPressure * 120);
  score += input.hasBankData ? 70 : -80;
  score += clamp(Math.floor(input.operatingMonths / 6) * 12, 0, 120);

  if (input.profileType === "PF") {
    score += 20;
  } else if (input.profileType === "MEI") {
    score += 35;
  } else {
    score += 50;
  }

  if (input.hasRestrictions) {
    score -= 220;
    reasons.push("Existem restrições informadas pelo solicitante.");
  }

  if (shouldEvaluateDocuments && docsCoverage < 0.6) {
    reasons.push("Cobertura documental abaixo do mínimo esperado.");
  }
  if (commitmentRatio > 0.45) {
    reasons.push("Comprometimento de renda/faturamento acima do ideal.");
  }
  if (requestPressure > 0.9) {
    reasons.push("Valor solicitado alto para a capacidade financeira declarada.");
  }
  if (maxAffordableAmount > 0 && input.requestedAmount > maxAffordableAmount) {
    reasons.push("Valor ajustado para manter a parcela dentro de 10% da renda/faturamento declarado.");
  }
  if (!input.hasBankData) {
    reasons.push("Dados bancários incompletos.");
  }
  if (input.operatingMonths < 12 && input.profileType !== "PF") {
    reasons.push("Tempo de atividade ainda baixo para empresas.");
  }

  score = clamp(score, 0, 1000);

  let riskLevel: CreditRiskLevel = "MEDIUM";
  if (score >= 760) {
    riskLevel = "LOW";
  } else if (score < 520) {
    riskLevel = "HIGH";
  }

  let recommendation: CreditRecommendation = "REVIEW_MANUALLY";
  if (score >= 700 && !input.hasRestrictions && docsCoverage >= 0.75) {
    recommendation = "APPROVE";
  } else if (score < 480 || (shouldEvaluateDocuments && docsCoverage < 0.45)) {
    recommendation = "REJECT";
  }

  const suggestedAmountFactor =
    recommendation === "APPROVE" ? 1 : recommendation === "REJECT" ? 0.45 : 0.72;
  const rawSuggestedAmount = money(input.requestedAmount * suggestedAmountFactor);
  const suggestedAmount =
    maxAffordableAmount > 0 ? money(Math.min(rawSuggestedAmount, maxAffordableAmount)) : rawSuggestedAmount;
  const suggestedTerm = clamp(
    recommendation === "REJECT" ? Math.max(6, Math.floor(input.desiredTerm * 0.7)) : input.desiredTerm,
    3,
    60,
  );

  if (!reasons.length) {
    reasons.push("Perfil aderente aos critérios atuais de análise.");
  }

  const internalNotes =
    recommendation === "APPROVE"
      ? "Pré-aprovação possível, sujeito a validação final e política interna."
      : recommendation === "REJECT"
        ? "Risco elevado para automação; avaliar nova tentativa com dados complementares."
        : "Necessária revisão manual do analista para decisão final.";

  return {
    score,
    riskLevel,
    recommendation,
    suggestedAmount,
    suggestedTerm,
    reasons,
    internalNotes,
  };
}
