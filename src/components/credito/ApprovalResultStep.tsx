import type { WizardSubmitResult } from "@/components/credito/types";
import { formatCurrencyBrl } from "@/lib/credit/helpers";
import {
  calculateInstallmentWithInterest,
  getMarketMonthlyInterestRate,
} from "@/services/credit/calculateInstallmentWithInterest";

type ApprovalResultStepProps = {
  result: WizardSubmitResult;
  selectedAmount: number | null;
  onSelectAmount: (amount: number) => void;
  onBack: () => void;
  onAdvance: () => void;
};

function money(value: number) {
  return Number(value.toFixed(2));
}

function buildProposalAmounts(result: WizardSubmitResult) {
  const approvedAmount = Math.max(0, result.approvedAmount);
  const term = Math.max(1, result.approvedTerm || 12);
  const factors = [1, 0.75, 0.5];
  const tags = [
    ["Boa chance de aprovação"],
    ["Aceitamos negativados", "Dinheiro rápido"],
    ["Pré-aprovado", "Resposta online"],
  ];
  const descriptions = [
    "A melhor chance de aprovação disponível para o seu perfil",
    "Dinheiro na conta em até um dia útil após confirmação",
    "Oferta ajustada para manter a parcela dentro do limite informado",
  ];
  const riskAdjustments = [0.35, 0.75, 0.15];

  return factors.map((factor, index) => {
    const amount = money(approvedAmount * factor);
    const monthlyRate = getMarketMonthlyInterestRate(term, riskAdjustments[index]);

    return {
      id: `proposal-${index + 1}`,
      amount,
      installmentAmount: calculateInstallmentWithInterest({
        principal: amount,
        term,
        monthlyInterestRatePercent: monthlyRate,
      }),
      monthlyRate,
      term,
      tags: tags[index],
      description: descriptions[index],
    };
  });
}

export function ApprovalResultStep({
  result,
  selectedAmount,
  onSelectAmount,
  onBack,
  onAdvance,
}: ApprovalResultStepProps) {
  const proposals = buildProposalAmounts(result);

  function chooseProposal(amount: number) {
    onSelectAmount(amount);
    onAdvance();
  }

  return (
    <div className="credpagos-approval-flow">
      <article className="credpagos-offers-card">
        <h2 className="credpagos-offers-title">
          Ofertas encontradas ({proposals.length})
        </h2>

        <div className="credpagos-proposal-options" role="list">
          {proposals.map((proposal) => {
            const isSelected = selectedAmount === proposal.amount;

            return (
              <article
                key={proposal.id}
                className={`credpagos-proposal-option${isSelected ? " is-selected" : ""}`}
              >
                <div className="credpagos-proposal-tags">
                  {proposal.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>

                <div className="credpagos-proposal-body">
                  <h3>Empréstimo pessoal</h3>

                  <p className="credpagos-proposal-installment">
                    {proposal.term}x de {formatCurrencyBrl(proposal.installmentAmount)}
                  </p>

                  <strong className="credpagos-proposal-amount">
                    {formatCurrencyBrl(proposal.amount)}
                  </strong>

                  <p className="credpagos-proposal-description">
                    {proposal.description}
                  </p>
                </div>

                <button
                  type="button"
                  className="credpagos-proposal-action"
                  onClick={() => chooseProposal(proposal.amount)}
                >
                  Pedir empréstimo
                </button>

                <button
                  type="button"
                  className="credpagos-proposal-details"
                  onClick={() => onSelectAmount(proposal.amount)}
                >
                  Mais detalhes
                </button>
              </article>
            );
          })}
        </div>
      </article>

      <div className="credpagos-wizard-actions">
        <button
          type="button"
          className="credpagos-credito-button credpagos-credito-button--ghost"
          onClick={onBack}
        >
          Voltar
        </button>
      </div>
    </div>
  );
}
