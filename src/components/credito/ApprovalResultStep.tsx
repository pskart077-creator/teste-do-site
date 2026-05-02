import type { WizardSubmitResult } from "@/components/credito/types";
import { CreditStatusBadge } from "@/components/credito/CreditStatusBadge";
import { formatCurrencyBrl } from "@/lib/credit/helpers";

type ApprovalResultStepProps = {
  result: WizardSubmitResult;
  onBack: () => void;
  onAdvance: () => void;
  onOpenStatus?: () => void;
};

export function ApprovalResultStep({
  result,
  onBack,
  onAdvance,
  onOpenStatus,
}: ApprovalResultStepProps) {
  const headlineAmount = result.isApproved
    ? result.approvedAmount
    : result.requestedAmount;

  return (
    <div className="credpagos-approval-flow">
      <article className="credpagos-approval-card">
        <span className="credpagos-credito-eyebrow">
          {result.isApproved ? "Fase 2 — Aprovação" : "Solicitação enviada"}
        </span>

        <div className="credpagos-approval-hero">
          <div>
            <p className="credpagos-approval-kicker">
              {result.isApproved
                ? "Solicitação aprovada"
                : "Solicitação enviada"}
            </p>

            <h2>{result.isApproved ? "Crédito aprovado" : "Análise iniciada"}</h2>

            <p>
              {result.isApproved
                ? "Sua análise inicial foi aprovada. Confira o valor aprovado e acompanhe os próximos passos da proposta."
                : "Recebemos seus dados e a solicitação entrou em análise pela Credpagos."}
            </p>
          </div>

          <CreditStatusBadge status={result.status} />
        </div>

        <div className="credpagos-approval-amount">
          <span>{result.isApproved ? "Valor aprovado" : "Valor enviado"}</span>
          <strong>{formatCurrencyBrl(headlineAmount)}</strong>
        </div>

        <div className="credpagos-approval-grid">
          <div>
            <span>Valor solicitado</span>
            <strong>{formatCurrencyBrl(result.requestedAmount)}</strong>
          </div>

          <div>
            <span>Valor líquido estimado</span>
            <strong>{formatCurrencyBrl(result.estimatedNetAmount)}</strong>
          </div>

          <div>
            <span>Prazo aprovado</span>
            <strong>{result.approvedTerm} meses</strong>
          </div>

          {typeof result.approvedInstallmentAmount === "number" ? (
            <div>
              <span>Parcela aprovada</span>
              <strong>
                {formatCurrencyBrl(result.approvedInstallmentAmount)}
              </strong>
            </div>
          ) : null}

          {typeof result.maxInstallmentAmount === "number" ? (
            <div>
              <span>Limite pela renda</span>
              <strong>{formatCurrencyBrl(result.maxInstallmentAmount)}</strong>
            </div>
          ) : null}

          <div>
            <span>Protocolo</span>
            <strong>{result.protocol}</strong>
          </div>
        </div>

        {result.incomeCapacityApplied ? (
          <p className="credpagos-alert">
            O valor aprovado foi ajustado para manter a parcela dentro do limite
            de 10% da renda informada.
          </p>
        ) : null}

        {onOpenStatus ? (
          <button
            type="button"
            className="credpagos-credito-button credpagos-credito-button--primary"
            onClick={onOpenStatus}
          >
            Acompanhar a solicitação
          </button>
        ) : null}
      </article>

      <div className="credpagos-wizard-actions">
        <button
          type="button"
          className="credpagos-credito-button credpagos-credito-button--ghost"
          onClick={onBack}
        >
          Voltar
        </button>

        <button
          type="button"
          className="credpagos-credito-button credpagos-credito-button--primary"
          onClick={onOpenStatus ?? onAdvance}
        >
          Avançar
        </button>
      </div>
    </div>
  );
}