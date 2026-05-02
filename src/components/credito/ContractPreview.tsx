import type { CreditContract } from "@prisma/client";

type ContractPreviewProps = {
  contract: CreditContract;
  accepted: boolean;
  onAcceptedChange?: (value: boolean) => void;
  onAcceptContract?: () => void;
  isBusy?: boolean;
};

export function ContractPreview({
  contract,
  accepted,
  onAcceptedChange,
  onAcceptContract,
  isBusy = false,
}: ContractPreviewProps) {
  return (
    <article className="credpagos-contrato-preview">
      <h3 className="credpagos-credito-card-title">Contrato</h3>

      <div className="credpagos-key-value">
        <span>Número do contrato</span>
        <strong>{contract.contractNumber}</strong>
      </div>

      <pre>{contract.content}</pre>

      <div className="credpagos-form-checkboxes">
        <label className="credpagos-form-check">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => onAcceptedChange?.(event.target.checked)}
          />
          <span>Li e aceito as condições</span>
        </label>
      </div>

      {onAcceptContract ? (
        <button
          type="button"
          className="credpagos-credito-button credpagos-credito-button--primary"
          disabled={!accepted || isBusy}
          onClick={onAcceptContract}
        >
          {isBusy ? "Confirmando..." : "Confirmar aceite digital"}
        </button>
      ) : null}
    </article>
  );
}