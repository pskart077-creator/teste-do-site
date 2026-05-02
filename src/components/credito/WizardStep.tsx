import type { ReactNode } from "react";

type WizardStepProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function WizardStep({ title, description, children }: WizardStepProps) {
  return (
    <section className="credpagos-wizard-content">
      <header className="credpagos-credito-header">
        <h2 className="credpagos-wizard-step-title">{title}</h2>
        <p className="credpagos-wizard-step-description">{description}</p>
      </header>
      {children}
    </section>
  );
}
