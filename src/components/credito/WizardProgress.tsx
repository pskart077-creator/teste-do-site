import type { WizardStepMeta } from "@/components/credito/types";

type WizardProgressProps = {
  steps: WizardStepMeta[];
  currentStep: number;
};

export function WizardProgress({ steps, currentStep }: WizardProgressProps) {
  const safeStep = Math.min(Math.max(currentStep, 0), steps.length - 1);
  const progress = ((safeStep + 1) / steps.length) * 100;

  return (
    <div className="credpagos-wizard-progress">
      <div className="credpagos-p">
        Etapa <strong>{safeStep + 1}</strong> de <strong>{steps.length}</strong>
      </div>
      <div className="credpagos-wizard-progress-bar" aria-hidden="true">
        <div className="credpagos-wizard-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="credpagos-wizard-steps">
        {steps.map((step, index) => (
          <span
            key={step.id}
            className={`credpagos-wizard-step${index === safeStep ? " is-active" : ""}`}
          >
            {step.title}
          </span>
        ))}
      </div>
    </div>
  );
}
