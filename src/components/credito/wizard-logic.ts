import type { CreditSimulationResult } from "@/lib/credit/types";
import { calculateCreditSimulation } from "@/services/credit/calculateCreditSimulation";
import type { CreditWizardDraft, WizardErrors, WizardMode, WizardStepMeta } from "@/components/credito/types";
import { MEI_STEPS, PF_STEPS, PJ_STEPS } from "@/components/credito/options";

const REVIEW_STEP_ID = "revisao";

function withoutReviewStep(steps: WizardStepMeta[]) {
  return steps.filter((step) => step.id !== REVIEW_STEP_ID);
}

function requireField(errors: WizardErrors, key: string, value: string | number | boolean, message: string) {
  if (typeof value === "string" && !value.trim()) {
    errors[key] = message;
    return;
  }
  if (typeof value === "number" && (!Number.isFinite(value) || value <= 0)) {
    errors[key] = message;
    return;
  }
  if (typeof value === "boolean" && !value) {
    errors[key] = message;
  }
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function isValidCpf(value: string) {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
    return false;
  }

  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    sum += Number(cpf[index]) * (10 - index);
  }
  let check = (sum * 10) % 11;
  if (check === 10) {
    check = 0;
  }
  if (check !== Number(cpf[9])) {
    return false;
  }

  sum = 0;
  for (let index = 0; index < 10; index += 1) {
    sum += Number(cpf[index]) * (11 - index);
  }
  check = (sum * 10) % 11;
  if (check === 10) {
    check = 0;
  }
  return check === Number(cpf[10]);
}

function isValidCnpj(value: string) {
  const cnpj = onlyDigits(value);
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) {
    return false;
  }

  const calculateDigit = (base: string, factors: number[]) => {
    let total = 0;
    for (let index = 0; index < factors.length; index += 1) {
      total += Number(base[index]) * factors[index];
    }
    const mod = total % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const firstDigit = calculateDigit(cnpj, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calculateDigit(`${cnpj.slice(0, 12)}${firstDigit}`, [
    6,
    5,
    4,
    3,
    2,
    9,
    8,
    7,
    6,
    5,
    4,
    3,
    2,
  ]);

  return cnpj.endsWith(`${firstDigit}${secondDigit}`);
}

function requireCpf(errors: WizardErrors, key: string, value: string, message = "Informe um CPF valido.") {
  if (!isValidCpf(value)) {
    errors[key] = message;
  }
}

function requireCnpj(errors: WizardErrors, key: string, value: string, message = "Informe um CNPJ valido.") {
  if (!isValidCnpj(value)) {
    errors[key] = message;
  }
}

function requireEmail(errors: WizardErrors, key: string, value: string, message = "Informe um e-mail valido.") {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    errors[key] = message;
  }
}

function requireMinLength(errors: WizardErrors, key: string, value: string, min: number, message: string) {
  if (value.trim().length < min) {
    errors[key] = message;
  }
}

function requireFirstAndLastName(errors: WizardErrors, key: string, value: string, message: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) {
    errors[key] = message;
  }
}

function validateAddress(errors: WizardErrors, draft: CreditWizardDraft, requireDistrict: boolean) {
  requireMinLength(errors, "address.zipcode", draft.address.zipcode, 8, "Informe um CEP valido.");
  requireField(errors, "address.street", draft.address.street, "Informe a rua.");
  requireField(errors, "address.number", draft.address.number, "Informe o numero.");
  if (requireDistrict) {
    requireField(errors, "address.district", draft.address.district, "Informe o bairro.");
  }
  requireField(errors, "address.city", draft.address.city, "Informe a cidade.");
  requireMinLength(errors, "address.state", draft.address.state, 2, "Informe a UF com 2 letras.");
}

function validateBankData(errors: WizardErrors, draft: CreditWizardDraft) {
  requireField(errors, "bank.bank", draft.bank.bank, "Informe o banco.");
  requireField(errors, "bank.agency", draft.bank.agency, "Informe a agencia.");
  requireField(errors, "bank.account", draft.bank.account, "Informe a conta.");
  requireField(errors, "bank.accountType", draft.bank.accountType, "Selecione o tipo de conta.");
  requireField(errors, "bank.holderName", draft.bank.holderName, "Informe o nome do titular.");
  requireMinLength(
    errors,
    "bank.holderDocument",
    draft.bank.holderDocument,
    5,
    "Informe o documento do titular.",
  );
  requireMinLength(errors, "bank.pixKey", draft.bank.pixKey, 3, "Informe a chave de recebimento.");
  requireField(errors, "bank.ownershipConfirmed", draft.bank.ownershipConfirmed, "Confirme a titularidade.");
}

function validateConsents(errors: WizardErrors, draft: CreditWizardDraft) {
  requireField(errors, "consent.consentDataProcessing", draft.consent.consentDataProcessing, "Aceite obrigatorio.");
  requireField(errors, "consent.consentContact", draft.consent.consentContact, "Aceite obrigatorio.");
  requireField(errors, "consent.consentTrueInfo", draft.consent.consentTrueInfo, "Aceite obrigatorio.");
  requireField(errors, "consent.consentPrivacyPolicy", draft.consent.consentPrivacyPolicy, "Aceite obrigatorio.");
  requireField(errors, "consent.consentCreditQuery", draft.consent.consentCreditQuery, "Aceite obrigatorio.");
}

export function getStepsByMode(mode: WizardMode): WizardStepMeta[] {
  if (mode === "MEI") {
    return withoutReviewStep(MEI_STEPS);
  }
  if (mode === "PJ") {
    return withoutReviewStep(PJ_STEPS);
  }
  return withoutReviewStep(PF_STEPS);
}

export function validateWizardStep(mode: WizardMode, stepIndex: number, draft: CreditWizardDraft) {
  const errors: WizardErrors = {};

  if (mode === "PF") {
    if (stepIndex === 0) {
      requireField(errors, "pfData.fullName", draft.pfData?.fullName ?? "", "Informe o nome e sobrenome.");
      requireFirstAndLastName(
        errors,
        "pfData.fullName",
        draft.pfData?.fullName ?? "",
        "Informe nome e sobrenome.",
      );
      requireField(errors, "pfData.cpf", draft.pfData?.cpf ?? "", "Informe o CPF.");
      requireCpf(errors, "pfData.cpf", draft.pfData?.cpf ?? "");
      requireField(errors, "pfData.birthDate", draft.pfData?.birthDate ?? "", "Informe a data de nascimento.");
    }
    if (stepIndex === 1) {
      requireField(errors, "pfData.monthlyIncome", draft.pfData?.monthlyIncome ?? 0, "Informe a renda mensal.");
    }
  }

  if (mode === "MEI") {
    if (stepIndex === 0) {
      requireField(errors, "meiData.responsibleName", draft.meiData?.responsibleName ?? "", "Informe o nome do responsavel.");
      requireCpf(errors, "meiData.responsibleCpf", draft.meiData?.responsibleCpf ?? "", "Informe um CPF valido.");
      requireField(errors, "meiData.responsibleBirthDate", draft.meiData?.responsibleBirthDate ?? "", "Informe a data de nascimento.");
      requireField(errors, "meiData.responsibleEmail", draft.meiData?.responsibleEmail ?? "", "Informe o e-mail.");
      requireEmail(errors, "meiData.responsibleEmail", draft.meiData?.responsibleEmail ?? "");
      requireMinLength(
        errors,
        "meiData.responsibleWhatsapp",
        draft.meiData?.responsibleWhatsapp ?? "",
        10,
        "Informe um WhatsApp valido.",
      );
    }
    if (stepIndex === 1) {
      requireCnpj(errors, "meiData.cnpj", draft.meiData?.cnpj ?? "");
      requireField(errors, "meiData.legalName", draft.meiData?.legalName ?? "", "Informe a razao social.");
      requireField(errors, "meiData.openingDate", draft.meiData?.openingDate ?? "", "Informe a data de abertura.");
      requireField(errors, "meiData.monthlyRevenue", draft.meiData?.monthlyRevenue ?? 0, "Informe o faturamento mensal.");
    }
    if (stepIndex === 2) {
      validateAddress(errors, draft, false);
    }
    if (stepIndex === 3) {
      requireField(errors, "request.requestedAmount", draft.request.requestedAmount, "Informe o valor desejado.");
      requireField(errors, "request.purpose", draft.request.purpose, "Informe a finalidade.");
      validateConsents(errors, draft);
    }
    if (stepIndex === 4) {
      validateBankData(errors, draft);
    }
  }

  if (mode === "PJ") {
    if (stepIndex === 0) {
      requireCnpj(errors, "pjData.cnpj", draft.pjData?.cnpj ?? "");
      requireField(errors, "pjData.legalName", draft.pjData?.legalName ?? "", "Informe a razao social.");
      requireField(errors, "pjData.openingDate", draft.pjData?.openingDate ?? "", "Informe a data de abertura.");
      requireField(errors, "pjData.monthlyRevenue", draft.pjData?.monthlyRevenue ?? 0, "Informe o faturamento mensal.");
      requireField(errors, "pjData.segment", draft.pjData?.segment ?? "", "Informe o segmento.");
    }
    if (stepIndex === 1) {
      const firstPartner = draft.partners?.[0];
      requireField(errors, "partners.0.name", firstPartner?.name ?? "", "Cadastre ao menos um socio.");
      requireCpf(errors, "partners.0.cpf", firstPartner?.cpf ?? "", "Informe um CPF valido para o socio.");
      requireEmail(errors, "partners.0.email", firstPartner?.email ?? "", "Informe o e-mail do socio.");
      requireMinLength(errors, "partners.0.whatsapp", firstPartner?.whatsapp ?? "", 10, "Informe o WhatsApp do socio.");
    }
    if (stepIndex === 2) {
      validateAddress(errors, draft, false);
    }
    if (stepIndex === 3) {
      requireField(errors, "pjData.expensesMonthly", draft.pjData?.expensesMonthly ?? 0, "Informe as despesas mensais.");
      requireField(errors, "pjData.averageProfit", draft.pjData?.averageProfit ?? 0, "Informe o lucro medio.");
    }
    if (stepIndex === 4) {
      requireField(errors, "request.requestedAmount", draft.request.requestedAmount, "Informe o valor desejado.");
      requireField(errors, "request.purpose", draft.request.purpose, "Informe a finalidade.");
      validateConsents(errors, draft);
    }
    if (stepIndex === 5) {
      validateBankData(errors, draft);
    }
  }

  return errors;
}

export function buildSimulationFromDraft(draft: CreditWizardDraft, percent = 23): CreditSimulationResult {
  const monthlyIncome =
    draft.mode === "PF"
      ? draft.pfData?.monthlyIncome ?? 0
      : draft.mode === "MEI"
        ? draft.meiData?.monthlyRevenue ?? 0
        : draft.pjData?.averageProfit || draft.pjData?.monthlyRevenue || 0;

  return calculateCreditSimulation({
    requestedAmount: draft.request.requestedAmount > 0 ? draft.request.requestedAmount : 6500,
    operationalAdjustmentPercent: percent,
    desiredTerm: draft.request.desiredTerm,
    monthlyIncome,
  });
}
