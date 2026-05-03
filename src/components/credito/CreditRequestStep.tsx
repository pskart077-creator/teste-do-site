"use client";

import { useEffect, useRef, useState } from "react";
import {
  BoolField,
  SelectField,
  TextAreaField,
} from "@/components/credito/FormFields";
import { SHARED_WIZARD_OPTIONS } from "@/components/credito/FormFields";
import type {
  CreditConsentPayload,
  CreditRequestPayload,
} from "@/lib/credit/types";

type AccountData = {
  name: string;
  email: string;
  password: string;
  phone: string;
};

type CreditRequestStepProps = {
  request: CreditRequestPayload;
  account?: AccountData;
  consent: CreditConsentPayload;
  errors: Record<string, string>;
  includeAccountAndConsent?: boolean;
  simpleAmountOnly?: boolean;
  onRequestChange: <K extends keyof CreditRequestPayload>(
    field: K,
    value: CreditRequestPayload[K]
  ) => void;
  onAccountChange?: <K extends keyof AccountData>(
    field: K,
    value: AccountData[K]
  ) => void;
  onConsentChange: <K extends keyof CreditConsentPayload>(
    field: K,
    value: CreditConsentPayload[K]
  ) => void;
};

const CREDIT_AMOUNT_MIN = 500;
const CREDIT_AMOUNT_MAX = 100000;
const CREDIT_AMOUNT_STEP = 100;

const dueDayOptions = Array.from({ length: 28 }, (_, index) => {
  const day = index + 1;

  return {
    value: String(day),
    label: `Dia ${day}`,
  };
});

function formatCurrencyBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function useAnimatedNumber(value: number, duration = 420) {
  const [animatedValue, setAnimatedValue] = useState(value);
  const currentValueRef = useRef(value);

  useEffect(() => {
    const startValue = currentValueRef.current;
    const difference = value - startValue;
    const startTime = performance.now();

    let animationFrame = 0;

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const nextValue = startValue + difference * easedProgress;

      currentValueRef.current = nextValue;
      setAnimatedValue(nextValue);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        currentValueRef.current = value;
        setAnimatedValue(value);
      }
    }

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return animatedValue;
}

export function CreditRequestStep({
  request,
  consent,
  errors,
  includeAccountAndConsent = true,
  simpleAmountOnly = false,
  onRequestChange,
  onConsentChange,
}: CreditRequestStepProps) {
  const requestedAmount =
    Number(request.requestedAmount) > 0
      ? Number(request.requestedAmount)
      : CREDIT_AMOUNT_MIN;

  const animatedAmount = useAnimatedNumber(requestedAmount);

  const rangeProgress =
    ((requestedAmount - CREDIT_AMOUNT_MIN) /
      (CREDIT_AMOUNT_MAX - CREDIT_AMOUNT_MIN)) *
    100;

  return (
    <div className="credpagos-request-step">
      <section className="credpagos-simulator-card">
        <div className="credpagos-simulator-header">
          <span className="credpagos-form-kicker">Valor desejado</span>

          <h3 className="credpagos-simulator-title">
            Quanto você quer de crédito?
          </h3>

          <p className="credpagos-simulator-description">
            Ajuste o valor abaixo para iniciar a análise automática das
            possibilidades disponíveis.
          </p>
        </div>

        <div className="credpagos-simulator-amount-box">
          <span className="credpagos-simulator-amount-label">
            Valor desejado
          </span>

          <strong className="credpagos-simulator-amount">
            {formatCurrencyBRL(animatedAmount)}
          </strong>

          <span className="credpagos-simulator-amount-helper">
            Arraste para aumentar ou reduzir o valor
          </span>
        </div>

        <div
          className="credpagos-simulator-range-wrap"
          style={
            {
              "--credpagos-range-progress": `${rangeProgress}%`,
            } as React.CSSProperties
          }
        >
          <input
            className="credpagos-simulator-range"
            type="range"
            min={CREDIT_AMOUNT_MIN}
            max={CREDIT_AMOUNT_MAX}
            step={CREDIT_AMOUNT_STEP}
            value={requestedAmount}
            aria-label="Valor desejado"
            onChange={(event) =>
              onRequestChange(
                "requestedAmount",
                Number(
                  event.target.value
                ) as CreditRequestPayload["requestedAmount"]
              )
            }
          />

          <div className="credpagos-simulator-range-values">
            <span>{formatCurrencyBRL(CREDIT_AMOUNT_MIN)}</span>
            <span>{formatCurrencyBRL(CREDIT_AMOUNT_MAX)}</span>
          </div>
        </div>

        {errors["request.requestedAmount"] ? (
          <span className="credpagos-form-error">
            {errors["request.requestedAmount"]}
          </span>
        ) : null}
      </section>

      {simpleAmountOnly ? null : (
        <>
          <section className="credpagos-request-required-card">
            <div className="credpagos-form-section-header">
              <span className="credpagos-form-kicker">Dados necessários</span>

              <h3 className="credpagos-form-section-title">
                Complete as informações da solicitação
              </h3>

              <p className="credpagos-form-section-description">
                Esses dados ajudam a Credpagos a entender o objetivo do crédito
                e preparar a análise corretamente.
              </p>
            </div>

            <div className="credpagos-form-grid">
              <SelectField
                label="Prazo desejado"
                name="desiredTerm"
                value={request.desiredTerm}
                options={SHARED_WIZARD_OPTIONS.termOptions}
                onChange={(event) =>
                  onRequestChange(
                    "desiredTerm",
                    Number(
                      event.target.value
                    ) as CreditRequestPayload["desiredTerm"]
                  )
                }
              />

              <SelectField
                label="Melhor dia de vencimento"
                name="desiredDueDay"
                value={request.desiredDueDay}
                options={dueDayOptions}
                onChange={(event) =>
                  onRequestChange(
                    "desiredDueDay",
                    Number(
                      event.target.value
                    ) as CreditRequestPayload["desiredDueDay"]
                  )
                }
              />

              <SelectField
                label="Finalidade do crédito"
                name="purpose"
                value={request.purpose}
                options={SHARED_WIZARD_OPTIONS.purposeOptions}
                error={errors["request.purpose"]}
                onChange={(event) =>
                  onRequestChange(
                    "purpose",
                    event.target.value as CreditRequestPayload["purpose"]
                  )
                }
              />

              <div className="credpagos-form-span-full">
                <TextAreaField
                  label="Observações adicionais"
                  name="notes"
                  value={request.notes}
                  onChange={(event) =>
                    onRequestChange(
                      "notes",
                      event.target.value as CreditRequestPayload["notes"]
                    )
                  }
                />
              </div>
            </div>
          </section>

          {includeAccountAndConsent ? (
            <section className="credpagos-request-required-card">
              <div className="credpagos-form-section-header">
                <span className="credpagos-form-kicker">Autorizações</span>

                <h3 className="credpagos-form-section-title">
                  Confirme os termos para continuar
                </h3>

                <p className="credpagos-form-section-description">
                  Para enviar sua solicitação, precisamos das confirmações
                  abaixo.
                </p>
              </div>

              <div className="credpagos-form-checkboxes">
                <BoolField
                  label="Declaro que as informações fornecidas são verdadeiras."
                  checked={consent.consentTrueInfo}
                  onChange={(event) =>
                    onConsentChange("consentTrueInfo", event.target.checked)
                  }
                />

                <BoolField
                  label="Autorizo o tratamento dos meus dados para análise de crédito."
                  checked={consent.consentDataProcessing}
                  onChange={(event) =>
                    onConsentChange("consentDataProcessing", event.target.checked)
                  }
                />

                <BoolField
                  label="Autorizo contato por WhatsApp, telefone e e-mail."
                  checked={consent.consentContact}
                  onChange={(event) =>
                    onConsentChange("consentContact", event.target.checked)
                  }
                />

                <BoolField
                  label="Li e aceito a Política de Privacidade."
                  checked={consent.consentPrivacyPolicy}
                  onChange={(event) =>
                    onConsentChange("consentPrivacyPolicy", event.target.checked)
                  }
                />

                <BoolField
                  label="Estou ciente de que a solicitação passará por análise."
                  checked={consent.consentCreditQuery}
                  onChange={(event) =>
                    onConsentChange("consentCreditQuery", event.target.checked)
                  }
                />
              </div>

              <div className="credpagos-consent-errors">
                {errors["consent.consentTrueInfo"] ? (
                  <span className="credpagos-form-error">
                    {errors["consent.consentTrueInfo"]}
                  </span>
                ) : null}

                {errors["consent.consentDataProcessing"] ? (
                  <span className="credpagos-form-error">
                    {errors["consent.consentDataProcessing"]}
                  </span>
                ) : null}

                {errors["consent.consentContact"] ? (
                  <span className="credpagos-form-error">
                    {errors["consent.consentContact"]}
                  </span>
                ) : null}

                {errors["consent.consentPrivacyPolicy"] ? (
                  <span className="credpagos-form-error">
                    {errors["consent.consentPrivacyPolicy"]}
                  </span>
                ) : null}

                {errors["consent.consentCreditQuery"] ? (
                  <span className="credpagos-form-error">
                    {errors["consent.consentCreditQuery"]}
                  </span>
                ) : null}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
