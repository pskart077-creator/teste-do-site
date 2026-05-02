import { randomToken } from "@/lib/credit/helpers";
import type { CreditApplication, CreditProposal, CustomerProfile } from "@prisma/client";

export function generateContract(input: {
  application: Pick<CreditApplication, "id" | "profileType" | "purpose" | "desiredTerm">;
  customer: Pick<CustomerProfile, "name" | "document" | "email" | "phone">;
  proposal: Pick<
    CreditProposal,
    | "suggestedAmount"
    | "estimatedNetAmount"
    | "operationalAdjustmentPercent"
    | "operationalAdjustmentAmount"
    | "term"
    | "installmentAmount"
    | "interestRate"
    | "cet"
    | "iofAmount"
    | "dueDay"
  >;
}) {
  const now = new Date();
  const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const contractNumber = `CRD-${yyyymm}-${randomToken(8).toUpperCase()}`;

  const content = [
    `CONTRATO DE CRÉDITO CREDPAGOS Nº ${contractNumber}`,
    "",
    "PARTES",
    `Cliente: ${input.customer.name}`,
    `Documento: ${input.customer.document}`,
    `E-mail: ${input.customer.email}`,
    `Telefone: ${input.customer.phone}`,
    "Credpagos: Operação de crédito conforme políticas internas e instituições parceiras.",
    "",
    "CONDIÇÕES DA PROPOSTA",
    `Tipo de perfil: ${input.application.profileType}`,
    `Finalidade: ${input.application.purpose ?? "Não informada"}`,
    `Valor sugerido: R$ ${input.proposal.suggestedAmount.toFixed(2)}`,
    `Valor líquido estimado: R$ ${input.proposal.estimatedNetAmount.toFixed(2)}`,
    `Percentual de ajuste operacional: ${input.proposal.operationalAdjustmentPercent.toFixed(2)}%`,
    `Ajuste operacional: R$ ${input.proposal.operationalAdjustmentAmount.toFixed(2)}`,
    `Prazo: ${input.proposal.term} meses`,
    `Parcela estimada: R$ ${input.proposal.installmentAmount.toFixed(2)}`,
    `Juros mensais estimados: ${input.proposal.interestRate.toFixed(2)}%`,
    `CET estimado: ${input.proposal.cet.toFixed(2)}%`,
    `IOF estimado: R$ ${input.proposal.iofAmount.toFixed(2)}`,
    `Dia de vencimento: ${input.proposal.dueDay ?? 10}`,
    "",
    "DISPOSIÇÕES",
    "A contratação depende de validações finais, políticas internas e aceite eletrônico.",
    "A liberação do crédito ocorrerá somente após confirmação operacional da Credpagos.",
    "Pagamentos por PIX, quando aplicáveis, referem-se apenas a obrigações contratuais legítimas.",
    "Não há promessa de aprovação garantida.",
  ].join("\n");

  return {
    contractNumber,
    content,
  };
}
