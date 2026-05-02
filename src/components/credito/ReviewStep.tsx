import type { CreditWizardDraft } from "@/components/credito/types";
import type { CreditSimulationResult } from "@/lib/credit/types";
import { CreditSimulationCard } from "@/components/credito/CreditSimulationCard";
import { formatCurrencyBrl } from "@/lib/credit/helpers";

type ReviewStepProps = {
  draft: CreditWizardDraft;
  simulation: CreditSimulationResult;
};

function valueOrFallback(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return "Não informado";
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "Não informado";
  }

  return value.trim() || "Não informado";
}

export function ReviewStep({ draft, simulation }: ReviewStepProps) {
  return (
    <div className="credpagos-form-grid credpagos-form-grid--one">
      <CreditSimulationCard simulation={simulation} />

      <article className="credpagos-status-card">
        <h3 className="credpagos-credito-card-title">Dados da solicitação</h3>

        <div className="credpagos-key-value">
          <span>Perfil</span>
          <strong>{draft.mode}</strong>
        </div>

        <div className="credpagos-key-value">
          <span>Valor desejado</span>
          <strong>{formatCurrencyBrl(draft.request.requestedAmount)}</strong>
        </div>

        <div className="credpagos-key-value">
          <span>Prazo desejado</span>
          <strong>{valueOrFallback(draft.request.desiredTerm)} meses</strong>
        </div>

        <div className="credpagos-key-value">
          <span>Finalidade</span>
          <strong>{valueOrFallback(draft.request.purpose)}</strong>
        </div>
      </article>

      <article className="credpagos-status-card">
        <h3 className="credpagos-credito-card-title">Documentos enviados</h3>

        {draft.documents.length ? (
          <ul>
            {draft.documents.map((doc) => (
              <li key={doc.localId}>
                {doc.type}: {doc.fileName}
              </li>
            ))}
          </ul>
        ) : (
          <p>Nenhum documento enviado.</p>
        )}
      </article>

      <article className="credpagos-status-card">
        <h3 className="credpagos-credito-card-title">Aviso importante</h3>

        <p>
          Sua solicitação pode ser pré-aprovada. A contratação depende da
          validação final dos documentos, aceite da proposta e formalização do
          contrato.
        </p>
      </article>
    </div>
  );
}