import type { CreditProposal } from "@prisma/client";
import { formatCurrencyBrl, formatPercent } from "@/lib/credit/helpers";

type ProposalCardProps = {
  proposal: CreditProposal;
  onAccept?: () => void;
  onReject?: () => void;
  isBusy?: boolean;
};

export function ProposalCard({
  proposal,
  onAccept,
  onReject,
  isBusy = false,
}: ProposalCardProps) {
  return (
    <article className="credpagos-proposta-card">
      <h3 className="credpagos-credito-card-title">Proposta disponível</h3>

      <div className="credpagos-key-value">
        <span>Valor solicitado</span>
        <strong>{formatCurrencyBrl(proposal.requestedAmount)}</strong>
      </div>

      <div className="credpagos-key-value">
        <span>Valor aprovado</span>
        <strong>{formatCurrencyBrl(proposal.suggestedAmount)}</strong>
      </div>

      <div className="credpagos-key-value">
        <span>Valor líquido estimado</span>
        <strong>{formatCurrencyBrl(proposal.estimatedNetAmount)}</strong>
      </div>

      <div className="credpagos-key-value">
        <span>Ajuste operacional</span>
        <strong>
          {formatPercent(proposal.operationalAdjustmentPercent)} (
          {formatCurrencyBrl(proposal.operationalAdjustmentAmount)})
        </strong>
      </div>

      <div className="credpagos-key-value">
        <span>Prazo / Parcela</span>
        <strong>
          {proposal.term} meses /{" "}
          {formatCurrencyBrl(proposal.installmentAmount)}
        </strong>
      </div>

      <div className="credpagos-key-value">
        <span>Juros / CET / IOF</span>
        <strong>
          {formatPercent(proposal.interestRate)} /{" "}
          {formatPercent(proposal.cet)} /{" "}
          {formatCurrencyBrl(proposal.iofAmount)}
        </strong>
      </div>

      <p className="credpagos-alert">
        Confira com atenção os dados da sua proposta. A contratação depende da
        validação final dos documentos, aceite das condições e formalização do
        contrato.
      </p>

      {onAccept || onReject ? (
        <div className="credpagos-admin-actions">
          {onAccept ? (
            <button
              type="button"
              className="credpagos-credito-button credpagos-credito-button--primary"
              disabled={isBusy}
              onClick={onAccept}
            >
              Aceitar a proposta
            </button>
          ) : null}

          {onReject ? (
            <button
              type="button"
              className="credpagos-credito-button credpagos-credito-button--ghost"
              disabled={isBusy}
              onClick={onReject}
            >
              Recusar a proposta
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}