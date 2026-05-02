import type {
  CreditApplicationStatus,
  CreditProfileType,
  CreditRecommendation,
  CreditRiskLevel,
} from "@prisma/client";

export type CreditWizardMode = "PF" | "MEI" | "PJ";

export type CreditConsentPayload = {
  consentDataProcessing: boolean;
  consentContact: boolean;
  consentTrueInfo: boolean;
  consentPrivacyPolicy: boolean;
  consentCreditQuery: boolean;
};

export type CreditAddressPayload = {
  zipcode: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
};

export type CreditBankPayload = {
  bank: string;
  agency: string;
  account: string;
  accountDigit: string;
  accountType: string;
  holderName: string;
  holderDocument: string;
  pixKey: string;
  ownershipConfirmed: boolean;
};

export type CreditRequestPayload = {
  requestedAmount: number;
  desiredTerm: number;
  desiredDueDay: number;
  purpose: string;
  notes: string;
};

export type CreditDocumentPayload = {
  type: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  size: number;
};

export type CreditPfPayload = {
  fullName: string;
  cpf: string;
  birthDate: string;
  motherName: string;
  maritalStatus: string;
  nationality: string;
  email: string;
  whatsapp: string;
  profession: string;
  incomeType: string;
  monthlyIncome: number;
  incomeTime: string;
  hasRestrictions: boolean;
  hasActiveLoans: boolean;
  currentInstallmentsAmount: number;
};

export type CreditMeiPayload = {
  responsibleName: string;
  responsibleCpf: string;
  responsibleBirthDate: string;
  responsibleEmail: string;
  responsibleWhatsapp: string;
  cnpj: string;
  legalName: string;
  tradeName: string;
  openingDate: string;
  cnae: string;
  activity: string;
  monthlyRevenue: number;
  yearlyRevenue: number;
  segment: string;
};

export type CreditPartnerPayload = {
  name: string;
  cpf: string;
  ownershipPercent: number;
  email: string;
  whatsapp: string;
  isAdministrator: boolean;
};

export type CreditPjPayload = {
  cnpj: string;
  legalName: string;
  tradeName: string;
  companyType: string;
  openingDate: string;
  cnae: string;
  segment: string;
  monthlyRevenue: number;
  yearlyRevenue: number;
  employeesCount: number;
  expensesMonthly: number;
  averageProfit: number;
  hasActiveLoans: boolean;
  currentInstallmentsAmount: number;
  hasBusinessRestrictions: boolean;
  hasPartnerRestrictions: boolean;
};

export type CreditWizardSubmissionPayload = {
  mode: CreditWizardMode;
  account: {
    name: string;
    email: string;
    password: string;
    phone: string;
  };
  consent: CreditConsentPayload;
  address: CreditAddressPayload;
  bank: CreditBankPayload;
  request: CreditRequestPayload;
  documents: CreditDocumentPayload[];
  pfData?: CreditPfPayload;
  meiData?: CreditMeiPayload;
  pjData?: CreditPjPayload;
  partners?: CreditPartnerPayload[];
};

export type CreditSimulationResult = {
  requestedAmount: number;
  approvedAmount: number;
  operationalAdjustmentPercent: number;
  operationalAdjustmentAmount: number;
  estimatedNetAmount: number;
  approvedEstimatedNetAmount: number;
  monthlyIncome: number;
  desiredTerm: number;
  maxInstallmentAmount: number;
  maxAffordableAmount: number;
  requestedInstallmentAmount: number;
  approvedInstallmentAmount: number;
  incomeCapacityApplied: boolean;
};

export type CreditAnalysisResult = {
  score: number;
  riskLevel: CreditRiskLevel;
  recommendation: CreditRecommendation;
  suggestedAmount: number;
  suggestedTerm: number;
  reasons: string[];
  internalNotes: string;
};

export type CreditStatusView = {
  id: string;
  protocol: string;
  customerName: string;
  profileType: CreditProfileType;
  status: CreditApplicationStatus;
  requestedAmount: number;
  estimatedNetAmount: number;
  updatedAt: string;
  nextStep: string;
};
