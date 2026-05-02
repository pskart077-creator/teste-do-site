import type { CreditApplicationStatus, CreditProfileType, PixProvider } from "@prisma/client";

export const CREDIT_CLIENT_SESSION_COOKIE = "credpagos_client_session";
export const CREDIT_CLIENT_SESSION_TTL_HOURS = 12;

export const CREDIT_ALLOWED_UPLOAD_MIME: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

export const CREDIT_ALLOWED_UPLOAD_EXTENSIONS = new Set(
  Object.values(CREDIT_ALLOWED_UPLOAD_MIME).flat(),
);

export const CREDIT_MAX_UPLOAD_SIZE_BYTES = 8 * 1024 * 1024;
export const CREDIT_MAX_UPLOAD_FILES_PER_APPLICATION = 20;

export const CREDIT_STATUS_LABELS: Record<CreditApplicationStatus, string> = {
  DRAFT: "Rascunho",
  SUBMITTED: "Solicitação enviada",
  IN_ANALYSIS: "Em análise",
  DOCUMENTS_PENDING: "Documentos pendentes",
  PRE_APPROVED: "Pré-aprovado",
  PROPOSAL_AVAILABLE: "Proposta disponível",
  PROPOSAL_ACCEPTED: "Proposta aceita",
  CONTRACT_GENERATED: "Contrato gerado",
  CONTRACT_SIGNED: "Contrato assinado",
  AWAITING_RELEASE: "Aguardando liberação",
  CREDIT_RELEASED: "Crédito liberado",
  REFUSED: "Recusado",
  CANCELED: "Cancelado",
};

export const CREDIT_PROFILE_LABELS: Record<CreditProfileType, string> = {
  PF: "Pessoa Física",
  MEI: "MEI",
  PJ: "Pessoa Jurídica",
};

export const CREDIT_TIMELINE_ORDER: CreditApplicationStatus[] = [
  "SUBMITTED",
  "IN_ANALYSIS",
  "DOCUMENTS_PENDING",
  "PRE_APPROVED",
  "PROPOSAL_AVAILABLE",
  "PROPOSAL_ACCEPTED",
  "CONTRACT_GENERATED",
  "CONTRACT_SIGNED",
  "AWAITING_RELEASE",
  "CREDIT_RELEASED",
];

export const CREDIT_DEFAULT_MESSAGES = {
  analysis:
    "Sua solicitação foi enviada e está em análise. A Credpagos acompanhará os dados informados e retornará com as próximas etapas.",
  preApproved:
    "Sua solicitação recebeu uma pré-aprovação. A contratação depende da validação final dos dados, documentos e aceite da proposta.",
  refused:
    "No momento, não conseguimos avançar com sua solicitação. Você poderá tentar novamente futuramente ou falar com nossa equipe.",
  pendingDocuments: "Precisamos de alguns documentos adicionais para continuar sua análise.",
  released:
    "Seu crédito foi liberado. A previsão de crédito em conta será exibida conforme os dados bancários informados e a confirmação operacional da Credpagos.",
};

export const CREDIT_PIX_ALLOWED_TYPES = [
  "INSTALLMENT",
  "SETTLEMENT",
  "CONTRACT_ENTRY",
  "ADMIN_FEE",
] as const;

export function getPixProviderFromEnv(): PixProvider {
  const raw = process.env.CREDPAGOS_PIX_PROVIDER?.trim().toUpperCase() ?? "VEXUSPAY";
  if (
    raw === "VEXUSPAY" ||
    raw === "MOCK" ||
    raw === "EFI" ||
    raw === "ASAAS" ||
    raw === "MERCADOPAGO" ||
    raw === "BANCO"
  ) {
    return raw;
  }
  return "VEXUSPAY";
}
