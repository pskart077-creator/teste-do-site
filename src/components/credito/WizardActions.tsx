type WizardActionsProps = {
  canGoBack: boolean;
  canGoNext: boolean;
  backLabel?: string;
  nextLabel?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
};

export function WizardActions({
  canGoBack,
  canGoNext,
  backLabel = "Voltar",
  nextLabel = "Continuar",
  submitLabel = "Enviar para análise",
  isSubmitting = false,
  onBack,
  onNext,
  onSubmit,
}: WizardActionsProps) {
  return (
    <div className="credpagos-wizard-actions">
      <button
        type="button"
        className="credpagos-credito-button credpagos-credito-button--ghost"
        disabled={!canGoBack || isSubmitting}
        onClick={onBack}
      >
        {backLabel}
      </button>

      {canGoNext ? (
        <button
          type="button"
          className="credpagos-credito-button credpagos-credito-button--primary"
          disabled={isSubmitting}
          onClick={onNext}
        >
          {nextLabel}
        </button>
      ) : (
        <button
          type="button"
          className="credpagos-credito-button credpagos-credito-button--primary"
          disabled={isSubmitting}
          onClick={onSubmit}
        >
          {isSubmitting ? "Enviando..." : submitLabel}
        </button>
      )}
    </div>
  );
}
