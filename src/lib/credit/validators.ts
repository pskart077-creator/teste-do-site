import { z } from "zod";
import { onlyDigits } from "@/lib/credit/helpers";
import type { CreditWizardSubmissionPayload } from "@/lib/credit/types";

export function isValidCpf(value: string) {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += Number(cpf[i]) * (10 - i);
  }
  let check = (sum * 10) % 11;
  if (check === 10) {
    check = 0;
  }
  if (check !== Number(cpf[9])) {
    return false;
  }

  sum = 0;
  for (let i = 0; i < 10; i += 1) {
    sum += Number(cpf[i]) * (11 - i);
  }
  check = (sum * 10) % 11;
  if (check === 10) {
    check = 0;
  }
  return check === Number(cpf[10]);
}

export function isValidCnpj(value: string) {
  const cnpj = onlyDigits(value);
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) {
    return false;
  }

  const calc = (base: string, factors: number[]) => {
    let total = 0;
    for (let i = 0; i < factors.length; i += 1) {
      total += Number(base[i]) * factors[i];
    }
    const mod = total % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const d1 = calc(cnpj, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = calc(`${cnpj.slice(0, 12)}${d1}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return cnpj.endsWith(`${d1}${d2}`);
}

const documentSchema = z.object({
  type: z.string().trim().min(2).max(80),
  fileUrl: z.string().trim().min(3).max(600),
  fileName: z.string().trim().min(2).max(220),
  mimeType: z.string().trim().min(3).max(120),
  size: z.number().int().min(1).max(8 * 1024 * 1024),
});

const baseSchema = z.object({
  mode: z.enum(["PF", "MEI", "PJ"]),
  account: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254),
    password: z.string().min(8).max(120),
    phone: z.string().trim().min(10).max(32),
  }),
  consent: z.object({
    consentDataProcessing: z.literal(true),
    consentContact: z.literal(true),
    consentTrueInfo: z.literal(true),
    consentPrivacyPolicy: z.literal(true),
    consentCreditQuery: z.literal(true),
  }),
  address: z.object({
    zipcode: z.string().trim().min(8).max(12),
    street: z.string().trim().min(2).max(160),
    number: z.string().trim().min(1).max(20),
    complement: z.string().trim().max(120),
    district: z.string().trim().min(2).max(120),
    city: z.string().trim().min(2).max(120),
    state: z.string().trim().min(2).max(2),
  }),
  bank: z.object({
    bank: z.string().trim().min(2).max(80),
    agency: z.string().trim().min(2).max(20),
    account: z.string().trim().min(2).max(30),
    accountDigit: z.string().trim().max(4),
    accountType: z.string().trim().min(2).max(40),
    holderName: z.string().trim().min(2).max(120),
    holderDocument: z.string().trim().min(5).max(18),
    pixKey: z.string().trim().min(3).max(120),
    ownershipConfirmed: z.literal(true),
  }),
  request: z.object({
    requestedAmount: z.number().positive(),
    desiredTerm: z.number().int().min(1).max(120),
    desiredDueDay: z.number().int().min(1).max(28),
    purpose: z.string().trim().min(2).max(160),
    notes: z.string().trim().max(1200),
  }),
  documents: z.array(documentSchema).min(0).max(20),
  pfData: z
    .object({
      fullName: z.string().trim().min(2).max(120),
      cpf: z.string().trim().min(11).max(14),
      birthDate: z.string().trim().min(4).max(30),
      motherName: z.string().trim().min(2).max(120),
      maritalStatus: z.string().trim().max(50),
      nationality: z.string().trim().max(50),
      email: z.string().trim().email().max(254),
      whatsapp: z.string().trim().min(10).max(32),
      profession: z.string().trim().min(2).max(120),
      incomeType: z.string().trim().min(2).max(80),
      monthlyIncome: z.number().min(0),
      incomeTime: z.string().trim().max(80),
      hasRestrictions: z.boolean(),
      hasActiveLoans: z.boolean(),
      currentInstallmentsAmount: z.number().min(0),
    })
    .optional(),
  meiData: z
    .object({
      responsibleName: z.string().trim().min(2).max(120),
      responsibleCpf: z.string().trim().min(11).max(14),
      responsibleBirthDate: z.string().trim().min(4).max(30),
      responsibleEmail: z.string().trim().email().max(254),
      responsibleWhatsapp: z.string().trim().min(10).max(32),
      cnpj: z.string().trim().min(14).max(18),
      legalName: z.string().trim().min(2).max(160),
      tradeName: z.string().trim().max(160),
      openingDate: z.string().trim().min(4).max(30),
      cnae: z.string().trim().max(40),
      activity: z.string().trim().max(120),
      monthlyRevenue: z.number().min(0),
      yearlyRevenue: z.number().min(0),
      segment: z.string().trim().max(80),
    })
    .optional(),
  pjData: z
    .object({
      cnpj: z.string().trim().min(14).max(18),
      legalName: z.string().trim().min(2).max(160),
      tradeName: z.string().trim().max(160),
      companyType: z.string().trim().max(80),
      openingDate: z.string().trim().min(4).max(30),
      cnae: z.string().trim().max(40),
      segment: z.string().trim().max(80),
      monthlyRevenue: z.number().min(0),
      yearlyRevenue: z.number().min(0),
      employeesCount: z.number().int().min(0).max(100000),
      expensesMonthly: z.number().min(0),
      averageProfit: z.number().min(0),
      hasActiveLoans: z.boolean(),
      currentInstallmentsAmount: z.number().min(0),
      hasBusinessRestrictions: z.boolean(),
      hasPartnerRestrictions: z.boolean(),
    })
    .optional(),
  partners: z
    .array(
      z.object({
        name: z.string().trim().min(2).max(120),
        cpf: z.string().trim().min(11).max(14),
        ownershipPercent: z.number().min(0).max(100),
        email: z.string().trim().email().max(254),
        whatsapp: z.string().trim().min(10).max(32),
        isAdministrator: z.boolean(),
      }),
    )
    .max(20)
    .optional(),
});

export const creditWizardSubmissionSchema = baseSchema.superRefine((data, ctx) => {
  if (data.mode === "PF") {
    if (!data.pfData) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Dados PF não enviados.",
        path: ["pfData"],
      });
      return;
    }
    if (!isValidCpf(data.pfData.cpf)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CPF inválido.",
        path: ["pfData", "cpf"],
      });
    }
  }

  if (data.mode === "MEI") {
    if (!data.meiData) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Dados MEI não enviados.",
        path: ["meiData"],
      });
      return;
    }
    if (!isValidCpf(data.meiData.responsibleCpf)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CPF do responsável inválido.",
        path: ["meiData", "responsibleCpf"],
      });
    }
    if (!isValidCnpj(data.meiData.cnpj)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CNPJ inválido.",
        path: ["meiData", "cnpj"],
      });
    }
  }

  if (data.mode === "PJ") {
    if (!data.pjData) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Dados PJ não enviados.",
        path: ["pjData"],
      });
      return;
    }
    if (!isValidCnpj(data.pjData.cnpj)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CNPJ inválido.",
        path: ["pjData", "cnpj"],
      });
    }
    if (!data.partners || data.partners.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Adicione ao menos um sócio.",
        path: ["partners"],
      });
    }
  }
});

export function validateCreditPayload(payload: unknown): CreditWizardSubmissionPayload {
  return creditWizardSubmissionSchema.parse(payload) as CreditWizardSubmissionPayload;
}
