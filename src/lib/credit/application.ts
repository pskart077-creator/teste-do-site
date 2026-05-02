import type {
  CreditApplicationStatus,
  CreditProfileType,
  CreditRecommendation,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { CreditWizardSubmissionPayload } from "@/lib/credit/types";
import { money } from "@/lib/credit/helpers";
import { getOrCreateCreditRules } from "@/lib/credit/rules";
import { createCreditCustomer } from "@/lib/credit/auth";
import { analyzeCreditApplication } from "@/services/credit/analyzeCreditApplication";
import { calculateCreditSimulation } from "@/services/credit/calculateCreditSimulation";
import { generateCreditProtocol } from "@/services/credit/generateCreditProtocol";
import { generateProposal } from "@/services/credit/generateProposal";
import { validateCreditRules } from "@/services/credit/validateCreditRules";

function requiredDocumentsCountByMode(mode: CreditWizardSubmissionPayload["mode"]) {
  void mode;
  return 0;
}

function parseOperatingMonths(payload: CreditWizardSubmissionPayload) {
  if (payload.mode === "MEI" && payload.meiData?.openingDate) {
    const opened = new Date(payload.meiData.openingDate);
    if (!Number.isNaN(opened.getTime())) {
      const diff = Date.now() - opened.getTime();
      return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24 * 30)));
    }
  }

  if (payload.mode === "PJ" && payload.pjData?.openingDate) {
    const opened = new Date(payload.pjData.openingDate);
    if (!Number.isNaN(opened.getTime())) {
      const diff = Date.now() - opened.getTime();
      return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24 * 30)));
    }
  }

  return 12;
}

function getRequestedProfileType(mode: CreditWizardSubmissionPayload["mode"]): CreditProfileType {
  if (mode === "MEI") {
    return "MEI";
  }
  if (mode === "PJ") {
    return "PJ";
  }
  return "PF";
}

function hasRestrictions(payload: CreditWizardSubmissionPayload) {
  if (payload.mode === "PF") {
    return Boolean(payload.pfData?.hasRestrictions);
  }
  if (payload.mode === "PJ") {
    return Boolean(payload.pjData?.hasBusinessRestrictions || payload.pjData?.hasPartnerRestrictions);
  }
  return false;
}

function getCurrentInstallmentsAmount(payload: CreditWizardSubmissionPayload) {
  if (payload.mode === "PF") {
    return money(payload.pfData?.currentInstallmentsAmount ?? 0);
  }
  if (payload.mode === "PJ") {
    return money(payload.pjData?.currentInstallmentsAmount ?? 0);
  }
  return 0;
}

function getMonthlyCapacity(payload: CreditWizardSubmissionPayload) {
  if (payload.mode === "PF") {
    return money(payload.pfData?.monthlyIncome ?? 0);
  }
  if (payload.mode === "MEI") {
    return money(payload.meiData?.monthlyRevenue ?? 0);
  }
  return money(payload.pjData?.monthlyRevenue ?? 0);
}

function isPreApprovalEligible(input: {
  recommendation: CreditRecommendation;
  score: number;
  minScore: number;
  isRulesValid: boolean;
  hasAllConsents: boolean;
}) {
  return (
    input.recommendation === "APPROVE" &&
    input.score >= input.minScore &&
    input.isRulesValid &&
    input.hasAllConsents
  );
}

function isRefused(input: {
  recommendation: CreditRecommendation;
  score: number;
  minScore: number;
  isRulesValid: boolean;
}) {
  if (!input.isRulesValid) {
    return true;
  }
  if (input.recommendation === "REJECT" && input.score < input.minScore - 80) {
    return true;
  }
  return false;
}

function hasAllConsents(payload: CreditWizardSubmissionPayload) {
  return (
    payload.consent.consentContact &&
    payload.consent.consentDataProcessing &&
    payload.consent.consentPrivacyPolicy &&
    payload.consent.consentTrueInfo &&
    payload.consent.consentCreditQuery
  );
}

export async function createApplicationFromWizardPayload(input: {
  payload: CreditWizardSubmissionPayload;
  consentIp?: string | null;
  consentUserAgent?: string | null;
}) {
  const { payload } = input;
  const rules = await getOrCreateCreditRules();

  const profileType = getRequestedProfileType(payload.mode);
  const simulation = calculateCreditSimulation({
    requestedAmount: payload.request.requestedAmount,
    operationalAdjustmentPercent: rules.defaultOperationalAdjustmentPercent,
    desiredTerm: payload.request.desiredTerm,
    monthlyIncome: getMonthlyCapacity(payload),
  });

  const rulesValidation = validateCreditRules({
    profileType,
    requestedAmount: simulation.requestedAmount,
    desiredTerm: payload.request.desiredTerm,
    rules,
  });

  const analysis = analyzeCreditApplication({
    profileType,
    requestedAmount: simulation.requestedAmount,
    desiredTerm: payload.request.desiredTerm,
    monthlyCapacity: getMonthlyCapacity(payload),
    currentInstallmentsAmount: getCurrentInstallmentsAmount(payload),
    hasRestrictions: hasRestrictions(payload),
    documentsCount: payload.documents.length,
    requiredDocumentsCount: requiredDocumentsCountByMode(payload.mode),
    hasBankData: Boolean(payload.bank.bank && payload.bank.account && payload.bank.holderDocument),
    operatingMonths: parseOperatingMonths(payload),
  });

  const preApprovalEligible = isPreApprovalEligible({
    recommendation: analysis.recommendation,
    score: analysis.score,
    minScore: rules.minScore,
    isRulesValid: rulesValidation.valid,
    hasAllConsents: hasAllConsents(payload),
  });

  const shouldRefuse = isRefused({
    recommendation: analysis.recommendation,
    score: analysis.score,
    minScore: rules.minScore,
    isRulesValid: rulesValidation.valid,
  });

  let status: CreditApplicationStatus = "IN_ANALYSIS";
  if (!rulesValidation.valid) {
    status = "DOCUMENTS_PENDING";
  }
  if (shouldRefuse) {
    status = "REFUSED";
  }
  if (preApprovalEligible) {
    status = "PRE_APPROVED";
  }

  const user =
    (await prisma.creditCustomerUser.findUnique({
      where: {
        email: payload.account.email.toLowerCase().trim(),
      },
    })) ??
    (await createCreditCustomer({
      name: payload.account.name,
      email: payload.account.email,
      phone: payload.account.phone,
      password: payload.account.password,
    }));

  const docSource =
    profileType === "PF" ? payload.pfData?.cpf : profileType === "MEI" ? payload.meiData?.cnpj : payload.pjData?.cnpj;
  const profile = await prisma.customerProfile.create({
    data: {
      userId: user.id,
      type: profileType,
      document: docSource ?? `DOC-${generateCreditProtocol()}`,
      name: payload.account.name,
      email: payload.account.email.toLowerCase().trim(),
      phone: payload.account.phone,
    },
  });

  const protocol = generateCreditProtocol();

  const created = await prisma.creditApplication.create({
    data: {
      protocol,
      customerId: profile.id,
      profileType,
      status,
      requestedAmount: simulation.requestedAmount,
      operationalAdjustmentPercent: simulation.operationalAdjustmentPercent,
      operationalAdjustmentAmount: simulation.operationalAdjustmentAmount,
      estimatedNetAmount: simulation.estimatedNetAmount,
      desiredTerm: payload.request.desiredTerm,
      desiredDueDay: payload.request.desiredDueDay,
      purpose: payload.request.purpose,
      notes: payload.request.notes || null,
      consentDataProcessing: payload.consent.consentDataProcessing,
      consentContact: payload.consent.consentContact,
      consentTrueInfo: payload.consent.consentTrueInfo,
      consentPrivacyPolicy: payload.consent.consentPrivacyPolicy,
      consentCreditQuery: payload.consent.consentCreditQuery,
      consentIp: input.consentIp ?? null,
      consentUserAgent: input.consentUserAgent ?? null,
      consentAt: new Date(),
      submittedAt: new Date(),
      personData: payload.pfData
        ? {
            create: {
              fullName: payload.pfData.fullName,
              cpf: payload.pfData.cpf,
              birthDate: payload.pfData.birthDate ? new Date(payload.pfData.birthDate) : null,
              motherName: payload.pfData.motherName,
              maritalStatus: payload.pfData.maritalStatus,
              nationality: payload.pfData.nationality,
              email: payload.pfData.email,
              whatsapp: payload.pfData.whatsapp,
              profession: payload.pfData.profession,
              incomeType: payload.pfData.incomeType,
              monthlyIncome: money(payload.pfData.monthlyIncome),
              incomeTime: payload.pfData.incomeTime,
              hasRestrictions: payload.pfData.hasRestrictions,
              hasActiveLoans: payload.pfData.hasActiveLoans,
              currentInstallmentsAmount: money(payload.pfData.currentInstallmentsAmount),
            },
          }
        : undefined,
      companyData: payload.meiData || payload.pjData
        ? {
            create: {
              responsibleName: payload.meiData?.responsibleName ?? null,
              responsibleCpf: payload.meiData?.responsibleCpf ?? null,
              responsibleBirthDate: payload.meiData?.responsibleBirthDate
                ? new Date(payload.meiData.responsibleBirthDate)
                : null,
              responsibleEmail: payload.meiData?.responsibleEmail ?? null,
              responsibleWhatsapp: payload.meiData?.responsibleWhatsapp ?? null,
              cnpj: payload.meiData?.cnpj ?? payload.pjData?.cnpj ?? null,
              legalName: payload.meiData?.legalName ?? payload.pjData?.legalName ?? null,
              tradeName: payload.meiData?.tradeName ?? payload.pjData?.tradeName ?? null,
              companyType: payload.pjData?.companyType ?? (payload.meiData ? "MEI" : null),
              openingDate:
                payload.meiData?.openingDate
                  ? new Date(payload.meiData.openingDate)
                  : payload.pjData?.openingDate
                    ? new Date(payload.pjData.openingDate)
                    : null,
              cnae: payload.meiData?.cnae ?? payload.pjData?.cnae ?? null,
              activity: payload.meiData?.activity ?? null,
              segment: payload.meiData?.segment ?? payload.pjData?.segment ?? null,
              monthlyRevenue: money(payload.meiData?.monthlyRevenue ?? payload.pjData?.monthlyRevenue ?? 0),
              yearlyRevenue: money(payload.meiData?.yearlyRevenue ?? payload.pjData?.yearlyRevenue ?? 0),
              employeesCount: payload.pjData?.employeesCount ?? null,
              expensesMonthly: money(payload.pjData?.expensesMonthly ?? 0),
              averageProfit: money(payload.pjData?.averageProfit ?? 0),
              hasBusinessRestrictions: payload.pjData?.hasBusinessRestrictions ?? false,
              hasPartnerRestrictions: payload.pjData?.hasPartnerRestrictions ?? false,
            },
          }
        : undefined,
      partners: payload.partners?.length
        ? {
            create: payload.partners.map((partner) => ({
              name: partner.name,
              cpf: partner.cpf,
              ownershipPercent: partner.ownershipPercent,
              email: partner.email,
              whatsapp: partner.whatsapp,
              isAdministrator: partner.isAdministrator,
            })),
          }
        : undefined,
      addresses: {
        create: [
          {
            type: profileType === "PF" ? "RESIDENTIAL" : "COMMERCIAL",
            zipcode: payload.address.zipcode,
            street: payload.address.street,
            number: payload.address.number,
            complement: payload.address.complement,
            district: payload.address.district,
            city: payload.address.city,
            state: payload.address.state,
          },
        ],
      },
      bankData: {
        create: {
          bank: payload.bank.bank,
          agency: payload.bank.agency,
          account: payload.bank.account,
          accountDigit: payload.bank.accountDigit,
          accountType: payload.bank.accountType,
          holderName: payload.bank.holderName,
          holderDocument: payload.bank.holderDocument,
          pixKey: payload.bank.pixKey,
          ownershipConfirmed: payload.bank.ownershipConfirmed,
        },
      },
      documents: {
        create: payload.documents.map((doc) => ({
          type: doc.type,
          fileUrl: doc.fileUrl,
          fileName: doc.fileName,
          mimeType: doc.mimeType,
          size: doc.size,
          status: "SENT",
        })),
      },
      analysis: {
        create: {
          score: analysis.score,
          riskLevel: analysis.riskLevel,
          recommendation: analysis.recommendation,
          suggestedAmount: analysis.suggestedAmount,
          suggestedTerm: analysis.suggestedTerm,
          reasons: [...analysis.reasons, ...rulesValidation.reasons],
          internalNotes: analysis.internalNotes,
        },
      },
      history: {
        create: [
          {
            fromStatus: "DRAFT",
            toStatus: "SUBMITTED",
            actorType: "CUSTOMER",
            actorId: user.id,
            note: "Dados enviados pelo cliente.",
          },
          {
            fromStatus: "SUBMITTED",
            toStatus: status,
            actorType: "SYSTEM",
            actorId: null,
            note:
              status === "PRE_APPROVED"
                ? "Pré-aprovado automaticamente e proposta gerada."
                : status === "REFUSED"
                  ? "Análise preliminar com recomendação de recusa."
                  : status === "DOCUMENTS_PENDING"
                    ? "Documentação complementar necessária."
                    : "Solicitação em análise preliminar.",
          },
        ],
      },
    },
    include: {
      analysis: true,
    },
  });

  let finalStatus: CreditApplicationStatus = created.status;
  let approvedAmount = created.analysis?.suggestedAmount ?? simulation.requestedAmount;
  let approvedTerm = created.analysis?.suggestedTerm ?? payload.request.desiredTerm;
  let approvedEstimatedNetAmount = simulation.estimatedNetAmount;

  if (preApprovalEligible && created.analysis) {
    const proposalValues = generateProposal({
      application: created,
      analysis: created.analysis,
      defaultInterestRate: rules.defaultInterestRate,
    });

    finalStatus = "PROPOSAL_AVAILABLE";
    approvedAmount = proposalValues.suggestedAmount;
    approvedTerm = proposalValues.term;
    approvedEstimatedNetAmount = proposalValues.estimatedNetAmount;

    await prisma.creditProposal.create({
      data: {
        applicationId: created.id,
        ...proposalValues,
        status: "AVAILABLE",
        availableAt: new Date(),
      },
    });

    await prisma.creditApplication.update({
      where: {
        id: created.id,
      },
      data: {
        status: "PROPOSAL_AVAILABLE",
        history: {
          create: {
            fromStatus: "PRE_APPROVED",
            toStatus: "PROPOSAL_AVAILABLE",
            actorType: "SYSTEM",
            actorId: null,
            note: "Proposta disponivel para aceite do cliente.",
          },
        },
      },
    });
  }

  return {
    id: created.id,
    protocol: created.protocol,
    status: finalStatus,
    requestedAmount: simulation.requestedAmount,
    approvedAmount,
    estimatedNetAmount: approvedEstimatedNetAmount,
    approvedTerm,
    approvedInstallmentAmount: simulation.approvedInstallmentAmount,
    maxInstallmentAmount: simulation.maxInstallmentAmount,
    incomeCapacityApplied: simulation.incomeCapacityApplied,
    isApproved: finalStatus === "PRE_APPROVED" || finalStatus === "PROPOSAL_AVAILABLE",
    score: created.analysis?.score ?? 0,
    riskLevel: created.analysis?.riskLevel ?? "MEDIUM",
    recommendation: created.analysis?.recommendation ?? "REVIEW_MANUALLY",
    simulation,
  };
}
