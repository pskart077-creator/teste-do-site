import type { CreditSimulationResult } from "@/lib/credit/types";
import { formatCurrencyBrl, formatPercent } from "@/lib/credit/helpers";

type CreditSimulationCardProps = {
  simulation: CreditSimulationResult;
};

export function CreditSimulationCard({
  simulation,
}: CreditSimulationCardProps) {
  return (
    <article className="credpagos-status-card">
      <h3 className="credpagos-credito-card-title">Resumo da simulação</h3>

      <div className="credpagos-key-value">
        <span>Valor solicitado</span>
        <strong>{formatCurrencyBrl(simulation.requestedAmount)}</strong>
      </div>

      <div className="credpagos-key-value">
        <span>Valor aprovado com base na renda</span>
        <strong>{formatCurrencyBrl(simulation.approvedAmount)}</strong>
      </div>

      <div className="credpagos-key-value">
        <span>Parcela máxima permitida</span>
        <strong>{formatCurrencyBrl(simulation.maxInstallmentAmount)}</strong>
      </div>

      <div className="credpagos-key-value">
        <span>Parcela aprovada estimada</span>
        <strong>
          {formatCurrencyBrl(simulation.approvedInstallmentAmount)}
        </strong>
      </div>

      <div className="credpagos-key-value">
        <span>Percentual de ajuste operacional</span>
        <strong>{formatPercent(simulation.operationalAdjustmentPercent)}</strong>
      </div>

      <div className="credpagos-key-value">
        <span>Ajuste operacional</span>
        <strong>
          {formatCurrencyBrl(simulation.operationalAdjustmentAmount)}
        </strong>
      </div>

      <div className="credpagos-key-value">
        <span>Valor líquido estimado</span>
        <strong>
          {formatCurrencyBrl(simulation.approvedEstimatedNetAmount)}
        </strong>
      </div>

      <p className="credpagos-alert">
        Esta é uma simulação inicial. A aprovação final depende da análise dos
        dados, documentos e critérios internos da Credpagos.
      </p>
    </article>
  );
}