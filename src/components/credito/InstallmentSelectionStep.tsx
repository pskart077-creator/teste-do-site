import { CREDIT_TERM_OPTIONS } from "@/components/credito/options";
import { formatCurrencyBrl } from "@/lib/credit/helpers";
import {
  calculateInstallmentWithInterest,
  getMarketMonthlyInterestRate,
} from "@/services/credit/calculateInstallmentWithInterest";

type InstallmentSelectionStepProps = {
  amount: number;
  maxInstallmentAmount?: number;
  selectedTerm: number | null;
  onSelectTerm: (term: number) => void;
  onBack: () => void;
  onAdvance: () => void;
};

export function InstallmentSelectionStep({
  amount,
  maxInstallmentAmount,
  selectedTerm,
  onSelectTerm,
  onBack,
  onAdvance,
}: InstallmentSelectionStepProps) {
  const terms = CREDIT_TERM_OPTIONS.map((term) => {
    const monthlyRate = getMarketMonthlyInterestRate(term, 0.35);
    const installmentAmount = calculateInstallmentWithInterest({
      principal: amount,
      term,
      monthlyInterestRatePercent: monthlyRate,
    });
    const isAllowed =
      typeof maxInstallmentAmount !== "number" ||
      installmentAmount <= maxInstallmentAmount;

    return {
      term,
      installmentAmount,
      monthlyRate,
      isAllowed,
    };
  });

  return (
    <div className="credpagos-approval-flow">
      <article className="credpagos-approval-card">
        <div className="credpagos-approval-hero">
          <div>
            <p className="credpagos-approval-kicker">Parcelamento</p>

            <h2>Escolha o total de parcelas</h2>

            <p>
              Valor selecionado: <strong>{formatCurrencyBrl(amount)}</strong>.
              Escolha em quantas parcelas deseja seguir.
            </p>
          </div>
        </div>

        <div className="credpagos-installment-options" role="radiogroup" aria-label="Total de parcelas">
          {terms.map((option) => {
            const isSelected = selectedTerm === option.term;

            return (
              <button
                key={option.term}
                type="button"
                className={`credpagos-installment-option${isSelected ? " is-selected" : ""}`}
                disabled={!option.isAllowed}
                onClick={() => onSelectTerm(option.term)}
                role="radio"
                aria-checked={isSelected}
              >
                <span>{option.term} parcelas</span>
                <strong>{formatCurrencyBrl(option.installmentAmount)}</strong>
                <em>{option.monthlyRate.toFixed(2).replace(".", ",")}% a.m.</em>
                <small>
                  {option.isAllowed
                    ? isSelected
                      ? "Selecionado"
                      : "Selecionar"
                    : "Acima do limite"}
                </small>
              </button>
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

        <button
          type="button"
          className="credpagos-credito-button credpagos-credito-button--primary"
          disabled={!selectedTerm}
          onClick={onAdvance}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
