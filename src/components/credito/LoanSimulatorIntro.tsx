"use client";

import { formatCurrencyBrl } from "@/lib/credit/helpers";
import {
  calculateInstallmentWithInterest,
  getMarketMonthlyInterestRate,
} from "@/services/credit/calculateInstallmentWithInterest";

type LoanSimulatorIntroProps = {
  amount: number;
  term: number;
  onAmountChange: (amount: number) => void;
  onTermChange: (term: number) => void;
  onSubmit: () => void;
};

const MIN_AMOUNT = 150;
const MAX_AMOUNT = 30000;
const AMOUNT_STEP = 50;
const MIN_TERM = 6;
const MAX_TERM = 48;
const TERM_STEP = 1;

function getProgress(value: number, min: number, max: number) {
  return ((value - min) / (max - min)) * 100;
}

export function LoanSimulatorIntro({
  amount,
  term,
  onAmountChange,
  onTermChange,
  onSubmit,
}: LoanSimulatorIntroProps) {
  const normalizedAmount = amount > 0 ? amount : 6500;
  const normalizedTerm = term > 0 ? term : 12;
  const amountProgress = getProgress(normalizedAmount, MIN_AMOUNT, MAX_AMOUNT);
  const termProgress = getProgress(normalizedTerm, MIN_TERM, MAX_TERM);
  const monthlyRate = getMarketMonthlyInterestRate(normalizedTerm);
  const installment = calculateInstallmentWithInterest({
    principal: normalizedAmount,
    term: normalizedTerm,
    monthlyInterestRatePercent: monthlyRate,
  });

  return (
    <section className="credpagos-loan-simulator">
      <header className="credpagos-loan-simulator-header">
        <h2>Simule seu empréstimo</h2>
        <p>
          Simule grátis um empréstimo pessoal para negativado e veja as melhores
          ofertas que cabem no seu bolso.
        </p>
      </header>

      <div className="credpagos-loan-simulator-card">
        <div className="credpagos-loan-simulator-controls">
          <div className="credpagos-loan-slider-block">
            <span>De quanto você precisa?</span>
            <strong>{formatCurrencyBrl(normalizedAmount)}</strong>
            <input
              type="range"
              min={MIN_AMOUNT}
              max={MAX_AMOUNT}
              step={AMOUNT_STEP}
              value={normalizedAmount}
              aria-label="Valor do empréstimo"
              style={
                {
                  "--credpagos-slider-progress": `${amountProgress}%`,
                } as React.CSSProperties
              }
              onChange={(event) => onAmountChange(Number(event.target.value))}
            />
            <div className="credpagos-loan-slider-limits">
              <span>{formatCurrencyBrl(MIN_AMOUNT)}</span>
              <span>{formatCurrencyBrl(MAX_AMOUNT)}</span>
            </div>
          </div>

          <div className="credpagos-loan-slider-block">
            <span>Em quantos meses quer pagar?</span>
            <strong>{normalizedTerm} meses</strong>
            <input
              type="range"
              min={MIN_TERM}
              max={MAX_TERM}
              step={TERM_STEP}
              value={normalizedTerm}
              aria-label="Prazo do empréstimo"
              style={
                {
                  "--credpagos-slider-progress": `${termProgress}%`,
                } as React.CSSProperties
              }
              onChange={(event) => onTermChange(Number(event.target.value))}
            />
            <div className="credpagos-loan-slider-limits">
              <span>{MIN_TERM} meses</span>
              <span>{MAX_TERM} meses</span>
            </div>
          </div>
        </div>

        <aside className="credpagos-loan-simulator-result">
          <span>Parcela mensal aproximada</span>
          <strong>
            <small>{normalizedTerm}x</small>
            {formatCurrencyBrl(installment)}
          </strong>
          <p>Estamos considerando as taxas médias oferecidas pelos parceiros.</p>
          <em>Taxa estimada: {monthlyRate.toFixed(2).replace(".", ",")}% a.m.</em>
        </aside>
      </div>

      <p className="credpagos-loan-simulator-note">*Sujeito à análise de crédito</p>

      <button
        type="button"
        className="credpagos-loan-simulator-button"
        onClick={onSubmit}
      >
        Solicitar empréstimo
      </button>
    </section>
  );
}
