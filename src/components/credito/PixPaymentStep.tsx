"use client";

import { useEffect, useState } from "react";
import type { WizardSubmitResult } from "@/components/credito/types";
import { formatCurrencyBrl } from "@/lib/credit/helpers";

type PixPayerInfo = {
  name: string;
  document: string;
  email?: string;
};

type VexusCashInChargeView = {
  amount: number;
  transactionId: string;
  status: string;
  copyPaste: string;
  qrCodeImageUrl: string;
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

type PixPaymentStepProps = {
  result: WizardSubmitResult;
  payer: PixPayerInfo;
  isPaid?: boolean;
  onPaymentConfirmed: () => void;
  onBack: () => void;
  onFinish: () => void;
};

const PIX_ANALYSIS_FEE_AMOUNT = 39.9;
const PIX_ANALYSIS_FEE_CODE = "3990";
const cashInChargeCache = new Map<string, VexusCashInChargeView>();
const cashInChargeRequests = new Map<string, Promise<VexusCashInChargeView>>();

async function readApiEnvelope<T>(response: Response) {
  const json = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !json?.success) {
    throw new Error(
      json?.success === false
        ? json.error?.message || "Não foi possível gerar a cobrança Pix."
        : "Não foi possível gerar a cobrança Pix.",
    );
  }

  return json.data;
}

function requestCashInCharge(input: {
  transactionId: string;
  protocol: string;
  payer: PixPayerInfo;
}) {
  const cached = cashInChargeCache.get(input.transactionId);

  if (cached) {
    return Promise.resolve(cached);
  }

  const pending = cashInChargeRequests.get(input.transactionId);

  if (pending) {
    return pending;
  }

  const request = fetch("/api/credito/pix/vexus/cash-in", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      protocol: input.protocol,
      transactionId: input.transactionId,
      payerName: input.payer.name,
      payerDocument: input.payer.document,
      payerEmail: input.payer.email,
    }),
  })
    .then((response) =>
      readApiEnvelope<{ charge: VexusCashInChargeView }>(response)
    )
    .then((data) => {
      cashInChargeCache.set(input.transactionId, data.charge);
      return data.charge;
    })
    .finally(() => {
      cashInChargeRequests.delete(input.transactionId);
    });

  cashInChargeRequests.set(input.transactionId, request);

  return request;
}

function isPaidProviderStatus(status: string) {
  return [
    "COMPLETED",
    "PAID",
    "PAGO",
    "APPROVED",
    "CONFIRMED",
    "LIQUIDATED",
  ].includes(status.toUpperCase());
}

function getReadablePixStatus(
  isPaid: boolean,
  charge: VexusCashInChargeView | null,
  isLoading: boolean,
  hasError: boolean,
) {
  if (isPaid || (charge?.status && isPaidProviderStatus(charge.status))) {
    return "Aprovado";
  }

  if (isLoading) {
    return "Gerando cobrança";
  }

  if (hasError && !charge) {
    return "Erro ao gerar Pix";
  }

  return "Aguardando pagamento";
}

export function PixPaymentStep({
  result,
  payer,
  isPaid = false,
  onPaymentConfirmed,
  onBack,
  onFinish,
}: PixPaymentStepProps) {
  const [charge, setCharge] = useState<VexusCashInChargeView | null>(null);
  const [isLoadingCharge, setIsLoadingCharge] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const transactionId = `${result.protocol}-PIX-${PIX_ANALYSIS_FEE_CODE}-${retryCount}`;
  const paymentBadge = isPaid ? "Aprovado" : "Pendente";
  const paymentStatus = getReadablePixStatus(
    isPaid,
    charge,
    isLoadingCharge,
    Boolean(errorMessage),
  );

  useEffect(() => {
    let cancelled = false;

    async function createCashInCharge() {
      setIsLoadingCharge(true);
      setErrorMessage(null);
      setCopyMessage(null);
      setCharge(null);

      try {
        const nextCharge = await requestCashInCharge({
          transactionId,
          protocol: result.protocol,
          payer,
        });

        if (cancelled) {
          return;
        }

        setCharge(nextCharge);

        if (isPaidProviderStatus(nextCharge.status)) {
          onPaymentConfirmed();
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Não foi possível gerar a cobrança Pix.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingCharge(false);
        }
      }
    }

    void createCashInCharge();

    return () => {
      cancelled = true;
    };
  }, [onPaymentConfirmed, payer, result.protocol, transactionId]);

  function retryCreateCharge() {
    cashInChargeCache.delete(transactionId);
    cashInChargeRequests.delete(transactionId);
    setCopyMessage(null);
    setRetryCount((current) => current + 1);
  }

  async function handleCopyPixCode() {
    if (!charge?.copyPaste) {
      setCopyMessage("Código Pix indisponível.");
      return;
    }

    try {
      await navigator.clipboard.writeText(charge.copyPaste);
      setCopyMessage("Código Pix copiado.");

      window.setTimeout(() => {
        setCopyMessage(null);
      }, 2500);
    } catch {
      setCopyMessage("Não foi possível copiar o código Pix.");
    }
  }

  useEffect(() => {
    if (!charge?.transactionId || isPaid) {
      return;
    }

    let cancelled = false;
    let isChecking = false;
    const statusTransactionId = charge.transactionId;

    async function checkStatus() {
      if (isChecking) {
        return;
      }

      isChecking = true;

      try {
        const data = await readApiEnvelope<{
          status: {
            status: string;
            paid: boolean;
            failed: boolean;
          };
        }>(
          await fetch("/api/credito/pix/vexus/status", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              transactionId: statusTransactionId,
            }),
          }),
        );

        if (cancelled) {
          return;
        }

        setCharge((current) =>
          current
            ? {
                ...current,
                status: data.status.status,
              }
            : current,
        );

        if (data.status.paid) {
          onPaymentConfirmed();
        }

        if (data.status.failed) {
          setErrorMessage(
            "Pagamento Pix não aprovado. Gere uma nova cobrança para tentar novamente.",
          );
        }
      } catch {
        if (!cancelled) {
          setErrorMessage(
            "Ainda não foi possível confirmar o Pix. A verificação automática continuará.",
          );
        }
      } finally {
        isChecking = false;
      }
    }

    void checkStatus();

    const interval = window.setInterval(() => {
      void checkStatus();
    }, 6_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [charge?.transactionId, isPaid, onPaymentConfirmed]);

  return (
    <div className="credpagos-approval-flow">
      <article className="credpagos-pix-simulation-card">
        <div className="credpagos-pix-topline">
          <span
            className={`credpagos-pix-payment-badge ${
              isPaid
                ? "credpagos-pix-payment-badge--paid"
                : "credpagos-pix-payment-badge--pending"
            }`}
          >
            {paymentBadge}
          </span>
        </div>

        <div className="credpagos-pix-simulation-layout">
          <div className="credpagos-pix-simulation-content">
            <h2>Confirme sua proposta com Pix</h2>

            <p>
              A sua oferta foi pré-aprovada. Para liberar a etapa de
              recebimento, confirme a taxa administrativa reembolsável de{" "}
              <strong>{formatCurrencyBrl(PIX_ANALYSIS_FEE_AMOUNT)}</strong>.
              Assim que o Pix for identificado, você informará a conta ou chave
              Pix para receber o valor aprovado em até 2 dias úteis.
            </p>

            <div className="credpagos-pix-refund-highlight">
              <span>Taxa 100% reembolsável</span>
              <strong>
                O valor pago agora cobre validação administrativa e ativação da
                proposta. Ele será somado ao crédito aprovado no momento da
                liberação.
              </strong>
            </div>

            <div className="credpagos-pix-trust-list" aria-label="Próximas etapas">
              <div>
                <strong>1</strong>
                <span>Pague via QR Code ou Pix copia e cola.</span>
              </div>
              <div>
                <strong>2</strong>
                <span>Após a confirmação, informe seus dados de recebimento.</span>
              </div>
              <div>
                <strong>3</strong>
                <span>O valor aprovado é processado em até 2 dias úteis.</span>
              </div>
            </div>

            <div className="credpagos-approval-grid credpagos-approval-grid--three">
              <div>
                <span>Taxa administrativa</span>
                <strong>{formatCurrencyBrl(PIX_ANALYSIS_FEE_AMOUNT)}</strong>
              </div>

              <div>
                <span>Protocolo</span>
                <strong>{result.protocol}</strong>
              </div>

              <div>
                <span>Status do pagamento</span>
                <strong>{paymentStatus}</strong>
              </div>
            </div>

            <div className="credpagos-form-group">
              <span className="credpagos-form-label">
                Pix copia e cola
              </span>

              <textarea
                className="credpagos-form-textarea"
                value={charge?.copyPaste ?? ""}
                placeholder={
                  isLoadingCharge
                    ? "Gerando cobrança Pix..."
                    : "Código Pix indisponível"
                }
                readOnly
              />

              <button
                type="button"
                className="credpagos-credito-button credpagos-credito-button--primary"
                onClick={handleCopyPixCode}
                disabled={isLoadingCharge || !charge?.copyPaste}
              >
                Copiar Pix copia e cola
              </button>

              {copyMessage ? (
                <span className="credpagos-form-helper">{copyMessage}</span>
              ) : null}
            </div>

            {errorMessage ? (
              <div className="credpagos-pix-error-box">
                <p className="credpagos-alert credpagos-alert--error">
                  {errorMessage}
                </p>

                <button
                  type="button"
                  className="credpagos-credito-button credpagos-credito-button--ghost"
                  onClick={retryCreateCharge}
                  disabled={isLoadingCharge}
                >
                  Tentar gerar Pix novamente
                </button>
              </div>
            ) : null}
          </div>

          <div
            className={`credpagos-pix-qr ${
              charge?.qrCodeImageUrl ? "credpagos-pix-qr--image" : ""
            }`}
            aria-label="QR Code Pix para pagamento"
          >
            {charge?.qrCodeImageUrl ? (
              <span
                className="credpagos-pix-qr-image"
                aria-hidden="true"
                style={{
                  backgroundImage: `url("${charge.qrCodeImageUrl}")`,
                }}
              />
            ) : (
              <span className="credpagos-pix-qr-placeholder">
                {isLoadingCharge ? "Gerando QR Code" : "QR Code indisponível"}
              </span>
            )}
          </div>
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
          disabled={!isPaid}
          onClick={onFinish}
        >
          {isPaid ? "Informar dados de recebimento" : "Aguardando Pix"}
        </button>
      </div>
    </div>
  );
}
