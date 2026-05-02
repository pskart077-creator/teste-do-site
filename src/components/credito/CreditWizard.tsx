"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AddressForm } from "@/components/credito/AddressForm";
import { AnalysisLoadingStep } from "@/components/credito/AnalysisLoadingStep";
import { BankDataForm } from "@/components/credito/BankDataForm";
import { BusinessDataStep } from "@/components/credito/BusinessDataStep";
import { ApprovalResultStep } from "@/components/credito/ApprovalResultStep";
import { CreditRequestStep } from "@/components/credito/CreditRequestStep";
import { IncomeStep } from "@/components/credito/IncomeStep";
import { MeiBusinessDataStep } from "@/components/credito/MeiBusinessDataStep";
import { MeiResponsibleStep } from "@/components/credito/MeiResponsibleStep";
import { PartnersStep } from "@/components/credito/PartnersStep";
import { PersonalDataForm } from "@/components/credito/PersonalDataForm";
import { PjDataForm } from "@/components/credito/PjDataForm";
import { PixPaymentStep } from "@/components/credito/PixPaymentStep";
import { ReviewStep } from "@/components/credito/ReviewStep";
import { WizardActions } from "@/components/credito/WizardActions";
import { WizardProgress } from "@/components/credito/WizardProgress";
import { WizardStep } from "@/components/credito/WizardStep";
import { createDefaultDraft } from "@/components/credito/defaults";
import type { CreditWizardDraft, WizardErrors, WizardMode, WizardSubmitResult } from "@/components/credito/types";
import { buildSimulationFromDraft, getStepsByMode, validateWizardStep } from "@/components/credito/wizard-logic";
import type {
  CreditBankPayload,
  CreditConsentPayload,
  CreditSimulationResult,
  CreditMeiPayload,
  CreditPartnerPayload,
  CreditPfPayload,
  CreditPjPayload,
  CreditRequestPayload,
} from "@/lib/credit/types";

type CreditWizardProps = {
  mode: WizardMode;
};

const ANALYSIS_LOADING_DELAY_MS = 2800;

function generateSimulationProtocol() {
  const now = new Date();
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const suffix = Math.random().toString(16).slice(2, 10).toUpperCase();

  return `SIM-${datePart}-${suffix}`;
}

function buildArtificialSubmitResult(
  draft: CreditWizardDraft,
  simulation: CreditSimulationResult,
): WizardSubmitResult {
  return {
    id: `sim-${Date.now()}`,
    protocol: generateSimulationProtocol(),
    status: "PROPOSAL_AVAILABLE",
    statusUrl: "",
    requestedAmount: simulation.requestedAmount,
    approvedAmount: simulation.approvedAmount,
    estimatedNetAmount: simulation.approvedEstimatedNetAmount,
    approvedTerm: draft.request.desiredTerm,
    approvedInstallmentAmount: simulation.approvedInstallmentAmount,
    maxInstallmentAmount: simulation.maxInstallmentAmount,
    incomeCapacityApplied: simulation.incomeCapacityApplied,
    isApproved: true,
  };
}

export function CreditWizard({ mode }: CreditWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<CreditWizardDraft>(() => createDefaultDraft(mode));
  const [errors, setErrors] = useState<WizardErrors>({});
  const [globalMessage, setGlobalMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<WizardSubmitResult | null>(null);
  const [postSubmitStep, setPostSubmitStep] = useState<"approval" | "pix">("approval");
  const [isPixPaid, setIsPixPaid] = useState(false);
  const steps = useMemo(() => getStepsByMode(mode), [mode]);
  const simulation = useMemo(() => buildSimulationFromDraft(draft, 23), [draft]);
  const storageKey = `credpagos-credito-wizard:${mode}`;
  const pixPayer = useMemo(() => {
    if (mode === "PF" && draft.pfData) {
      return {
        name: draft.pfData.fullName,
        document: draft.pfData.cpf,
        email: draft.pfData.email,
      };
    }

    if (mode === "MEI" && draft.meiData) {
      return {
        name: draft.meiData.responsibleName,
        document: draft.meiData.responsibleCpf,
        email: draft.meiData.responsibleEmail,
      };
    }

    return {
      name: draft.pjData?.legalName || draft.account.name,
      document: draft.pjData?.cnpj || draft.bank.holderDocument,
      email: draft.account.email,
    };
  }, [draft, mode]);
  const handlePixPaymentConfirmed = useCallback(() => {
    setIsPixPaid(true);
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as { step: number; draft: CreditWizardDraft };
      if (!parsed?.draft) {
        return;
      }
      setDraft(parsed.draft);
      setStep(Math.min(Math.max(parsed.step ?? 0, 0), steps.length - 1));
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [steps.length, storageKey]);

  useEffect(() => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        step,
        draft,
      }),
    );
  }, [draft, step, storageKey]);

  function updatePf(field: keyof CreditPfPayload, value: CreditPfPayload[keyof CreditPfPayload]) {
    setDraft((current) => ({
      ...current,
      pfData: {
        ...(current.pfData ?? createDefaultDraft("PF").pfData!),
        [field]: value,
      },
    }));
  }

  function updateMei(field: keyof CreditMeiPayload, value: CreditMeiPayload[keyof CreditMeiPayload]) {
    setDraft((current) => ({
      ...current,
      meiData: {
        ...(current.meiData ?? createDefaultDraft("MEI").meiData!),
        [field]: value,
      },
    }));
  }

  function updatePj(field: keyof CreditPjPayload, value: CreditPjPayload[keyof CreditPjPayload]) {
    setDraft((current) => ({
      ...current,
      pjData: {
        ...(current.pjData ?? createDefaultDraft("PJ").pjData!),
        [field]: value,
      },
    }));
  }

  function updateAddress(
    field: keyof CreditWizardDraft["address"],
    value: CreditWizardDraft["address"][keyof CreditWizardDraft["address"]],
  ) {
    setDraft((current) => ({
      ...current,
      address: {
        ...current.address,
        [field]: value,
      },
    }));
  }

  function updateBank(
    field: keyof CreditBankPayload,
    value: CreditBankPayload[keyof CreditBankPayload],
  ) {
    setDraft((current) => ({
      ...current,
      bank: {
        ...current.bank,
        [field]: value,
      },
    }));
  }

  function updateRequest(
    field: keyof CreditRequestPayload,
    value: CreditRequestPayload[keyof CreditRequestPayload],
  ) {
    setDraft((current) => ({
      ...current,
      request: {
        ...current.request,
        [field]: value,
      },
    }));
  }

  function updateConsent(
    field: keyof CreditConsentPayload,
    value: CreditConsentPayload[keyof CreditConsentPayload],
  ) {
    setDraft((current) => ({
      ...current,
      consent: {
        ...current.consent,
        [field]: value,
      },
    }));
  }

  function updateAccount(field: keyof CreditWizardDraft["account"], value: string) {
    setDraft((current) => ({
      ...current,
      account: {
        ...current.account,
        [field]: value,
      },
    }));
  }

  function updatePartners(nextPartners: CreditPartnerPayload[]) {
    setDraft((current) => ({
      ...current,
      partners: nextPartners,
    }));
  }

  function addPartner() {
    updatePartners([
      ...(draft.partners ?? []),
      {
        name: "",
        cpf: "",
        ownershipPercent: 0,
        email: "",
        whatsapp: "",
        isAdministrator: false,
      },
    ]);
  }

  function removePartner(index: number) {
    updatePartners((draft.partners ?? []).filter((_, partnerIndex) => partnerIndex !== index));
  }

  function updatePartner(
    index: number,
    field: keyof CreditPartnerPayload,
    value: CreditPartnerPayload[keyof CreditPartnerPayload],
  ) {
    const partners = [...(draft.partners ?? [])];
    const currentPartner = partners[index];
    if (!currentPartner) {
      return;
    }
    partners[index] = {
      ...currentPartner,
      [field]: value,
    };
    updatePartners(partners);
  }

  function handleStepValidation(targetStep: number) {
    const foundErrors = validateWizardStep(mode, targetStep, draft);
    setErrors(foundErrors);
    return Object.keys(foundErrors).length === 0;
  }

  function handleNext() {
    setGlobalMessage(null);
    setSubmitResult(null);
    setPostSubmitStep("approval");
    setIsPixPaid(false);
    const valid = handleStepValidation(step);
    if (!valid) {
      return;
    }
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function handleBack() {
    setGlobalMessage(null);
    setSubmitResult(null);
    setPostSubmitStep("approval");
    setIsPixPaid(false);
    setStep((current) => Math.max(current - 1, 0));
  }

  async function handleSubmit() {
    setGlobalMessage(null);

    for (let index = 0; index < steps.length; index += 1) {
      const valid = handleStepValidation(index);
      if (!valid) {
        setStep(index);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      window.localStorage.removeItem(storageKey);
      window.scrollTo({ top: 0, behavior: "smooth" });
      await new Promise((resolve) => window.setTimeout(resolve, ANALYSIS_LOADING_DELAY_MS));
      setSubmitResult(buildArtificialSubmitResult(draft, simulation));
      setPostSubmitStep("approval");
      setIsPixPaid(false);
    } catch {
      setGlobalMessage("Não foi possível concluir a simulação.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderStep() {
    if (mode === "PF") {
      if (step === 0) {
        return (
          <PersonalDataForm
            data={draft.pfData!}
            errors={errors}
            onChange={(field, value) => updatePf(field, value)}
          />
        );
      }
      if (step === 1) {
        return <AddressForm data={draft.address} errors={errors} onChange={updateAddress} />;
      }
      if (step === 2) {
        return (
          <IncomeStep
            data={draft.pfData!}
            errors={errors}
            onChange={(field, value) => updatePf(field, value)}
          />
        );
      }
      if (step === 3) {
        return <BankDataForm data={draft.bank} errors={errors} onChange={updateBank} />;
      }
      if (step === 4) {
        return (
          <CreditRequestStep
            request={draft.request}
            account={draft.account}
            consent={draft.consent}
            errors={errors}
            onRequestChange={updateRequest}
            onAccountChange={updateAccount}
            onConsentChange={updateConsent}
          />
        );
      }
      if (step === 5) {
        return <ReviewStep draft={draft} simulation={simulation} />;
      }
      return null;
    }

    if (mode === "MEI") {
      if (step === 0) {
        return (
          <MeiResponsibleStep
            data={draft.meiData!}
            errors={errors}
            onChange={(field, value) => updateMei(field, value)}
          />
        );
      }
      if (step === 1) {
        return (
          <MeiBusinessDataStep
            data={draft.meiData!}
            errors={errors}
            onChange={(field, value) => updateMei(field, value)}
          />
        );
      }
      if (step === 2) {
        return <AddressForm data={draft.address} errors={errors} onChange={updateAddress} />;
      }
      if (step === 3) {
        return (
          <CreditRequestStep
            request={draft.request}
            account={draft.account}
            consent={draft.consent}
            errors={errors}
            onRequestChange={updateRequest}
            onAccountChange={updateAccount}
            onConsentChange={updateConsent}
          />
        );
      }
      if (step === 4) {
        return <BankDataForm data={draft.bank} errors={errors} onChange={updateBank} />;
      }
      if (step === 5) {
        return <ReviewStep draft={draft} simulation={simulation} />;
      }
      return null;
    }

    if (step === 0) {
      return (
        <PjDataForm
          data={draft.pjData!}
          errors={errors}
          onChange={(field, value) => updatePj(field, value)}
        />
      );
    }
    if (step === 1) {
      return (
        <PartnersStep
          partners={draft.partners ?? []}
          errors={errors}
          onAddPartner={addPartner}
          onRemovePartner={removePartner}
          onChangePartner={updatePartner}
        />
      );
    }
    if (step === 2) {
      return <AddressForm data={draft.address} errors={errors} onChange={updateAddress} />;
    }
    if (step === 3) {
      return (
        <BusinessDataStep
          data={draft.pjData!}
          errors={errors}
          onChange={(field, value) => updatePj(field, value)}
        />
      );
    }
    if (step === 4) {
      return (
        <CreditRequestStep
          request={draft.request}
          account={draft.account}
          consent={draft.consent}
          errors={errors}
          onRequestChange={updateRequest}
          onAccountChange={updateAccount}
          onConsentChange={updateConsent}
        />
      );
    }
    if (step === 5) {
      return <BankDataForm data={draft.bank} errors={errors} onChange={updateBank} />;
    }
    if (step === 6) {
      return <ReviewStep draft={draft} simulation={simulation} />;
    }
    return null;
  }

  if (isSubmitting) {
    return (
      <div className="credpagos-wizard-wrapper">
        <WizardProgress steps={steps} currentStep={steps.length - 1} />
        <AnalysisLoadingStep />
      </div>
    );
  }

  if (submitResult) {
    if (postSubmitStep === "pix") {
      return (
        <div className="credpagos-wizard-wrapper">
          <PixPaymentStep
            result={submitResult}
            payer={pixPayer}
            isPaid={isPixPaid}
            onPaymentConfirmed={handlePixPaymentConfirmed}
            onBack={() => setPostSubmitStep("approval")}
            onFinish={() => router.push("/simular-credito")}
          />
        </div>
      );
    }

    return (
      <div className="credpagos-wizard-wrapper">
        <ApprovalResultStep
          result={submitResult}
          onBack={() => setSubmitResult(null)}
          onAdvance={() => setPostSubmitStep("pix")}
          onOpenStatus={
            submitResult.statusUrl
              ? () => router.push(submitResult.statusUrl)
              : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="credpagos-wizard-wrapper">
      <WizardProgress steps={steps} currentStep={step} />
      <WizardStep title={steps[step]?.title ?? "Etapa"} description={steps[step]?.description ?? ""}>
        {renderStep()}
        {globalMessage ? <p className="credpagos-alert credpagos-alert--error">{globalMessage}</p> : null}
      </WizardStep>
      <WizardActions
        canGoBack={step > 0}
        canGoNext={step < steps.length - 1}
        onBack={handleBack}
        onNext={handleNext}
        onSubmit={() => {
          void handleSubmit();
        }}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
