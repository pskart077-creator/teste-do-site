import type { CreditApplicationStatus, CreditDocumentStatus, CreditProfileType } from "@prisma/client";
import type { CreditDocumentPayload, CreditWizardSubmissionPayload } from "@/lib/credit/types";

export type WizardMode = CreditWizardSubmissionPayload["mode"];

export type WizardStepMeta = {
  id: string;
  title: string;
  description: string;
};

export type WizardErrors = Record<string, string>;

export type UploadedDocument = CreditDocumentPayload & {
  localId: string;
  status?: CreditDocumentStatus;
};

export type CreditWizardDraft = Omit<CreditWizardSubmissionPayload, "documents"> & {
  documents: UploadedDocument[];
};

export type WizardSubmitResult = {
  id: string;
  protocol: string;
  status: CreditApplicationStatus;
  statusUrl: string;
  requestedAmount: number;
  approvedAmount: number;
  estimatedNetAmount: number;
  approvedTerm: number;
  approvedInstallmentAmount?: number;
  maxInstallmentAmount?: number;
  incomeCapacityApplied?: boolean;
  isApproved: boolean;
};

export type ProfileTypeCardItem = {
  mode: WizardMode;
  title: string;
  description: string;
  href: string;
};

export type StatusOption = {
  value: CreditApplicationStatus | "";
  label: string;
};

export type ProfileOption = {
  value: CreditProfileType | "";
  label: string;
};
