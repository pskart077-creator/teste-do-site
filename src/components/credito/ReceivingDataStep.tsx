"use client";

import { useMemo, useState } from "react";
import { TextField } from "@/components/credito/FormFields";
import type { WizardSubmitResult } from "@/components/credito/types";
import { formatCurrencyBrl } from "@/lib/credit/helpers";

type ReceivingDataStepProps = {
  result: WizardSubmitResult;
  payerName: string;
  payerDocument: string;
  onBack: () => void;
  onFinish: () => void;
};

export function ReceivingDataStep({
  result,
  payerName,
  payerDocument,
  onBack,
  onFinish,
}: ReceivingDataStepProps) {
  const [holderName, setHolderName] = useState(payerName);
  const [holderDocument, setHolderDocument] = useState(payerDocument);
  const [pixKey, setPixKey] = useState("");
  const [bankName, setBankName] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);

  const canSubmit = useMemo(
    () =>
      holderName.trim().length >= 3 &&
      holderDocument.replace(/\D/g, "").length >= 11 &&
      pixKey.trim().length >= 3 &&
      bankName.trim().length >= 2,
    [bankName, holderDocument, holderName, pixKey],
  );

  if (isConfirmed) {
    return (
      <div className="credpagos-approval-flow">
        <article className="credpagos-receiving-card credpagos-receiving-card--success">
          <span className="credpagos-pix-payment-badge credpagos-pix-payment-badge--paid">
            Dados recebidos
          </span>
          <h2>Recebimento em processamento</h2>
          <p>
            Os dados de recebimento foram enviados. O valor aprovado de{" "}
            <strong>{formatCurrencyBrl(result.approvedAmount)}</strong> será
            processado para a conta informada em até 2 dias úteis.
          </p>
        </article>

        <div className="credpagos-wizard-actions">
          <button
            type="button"
            className="credpagos-credito-button credpagos-credito-button--primary"
            onClick={onFinish}
          >
            Concluir
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="credpagos-approval-flow">
      <article className="credpagos-receiving-card">
        <span className="credpagos-pix-payment-badge credpagos-pix-payment-badge--paid">
          Pix confirmado
        </span>

        <h2>Informe onde deseja receber</h2>

        <p>
          Agora falta apenas confirmar os dados de recebimento. O valor aprovado
          de <strong>{formatCurrencyBrl(result.approvedAmount)}</strong> será
          enviado para a conta informada em até 2 dias úteis após validação.
        </p>

        <div className="credpagos-form-grid">
          <TextField
            label="Nome do titular"
            name="holderName"
            value={holderName}
            onChange={(event) => setHolderName(event.target.value)}
          />

          <TextField
            label="CPF do titular"
            name="holderDocument"
            value={holderDocument}
            onChange={(event) => setHolderDocument(event.target.value)}
          />

          <TextField
            label="Banco ou instituição"
            name="bankName"
            value={bankName}
            onChange={(event) => setBankName(event.target.value)}
          />

          <TextField
            label="Chave Pix de recebimento"
            name="pixKey"
            value={pixKey}
            onChange={(event) => setPixKey(event.target.value)}
          />
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
          disabled={!canSubmit}
          onClick={() => setIsConfirmed(true)}
        >
          Enviar dados de recebimento
        </button>
      </div>
    </div>
  );
}
