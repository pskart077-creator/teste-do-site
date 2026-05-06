"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  BadgeDollarSign,
  CalendarCheck,
  Check,
  ChevronRight,
  Copy,
  FileText,
  Grid3X3,
  Info,
  Mail,
  Truck,
} from "lucide-react";
import { CardFlowHeader } from "@/components/credito/CardFlowHeader";
import {
  CARD_ISSUANCE_PAYMENT_ITEMS,
  CARD_ISSUANCE_PAYMENT_TOTAL,
} from "@/lib/credit/card-issuance";
import { getCardDisplayNumber } from "@/lib/credit/card-display-number";
import { formatCurrencyBrl } from "@/lib/credit/helpers";

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

type CardIssuancePaymentView = {
  amount: number;
  transactionId: string | null;
  status: string;
  providerStatus: string;
  paid: boolean;
  failed: boolean;
  qrCodeImageUrl: string | null;
  copyPaste: string | null;
  paidAt: string | null;
  error: string | null;
};

export type CardIssuanceRequestView = {
  token: string;
  protocol: string;
  fullName: string;
  email: string;
  approvedLimit: number;
  invoiceDueDay: string | null;
  address: {
    zipCode: string | null;
    street: string | null;
    number: string | null;
    complement: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
  };
  payment: CardIssuancePaymentView;
};

type CardIssuanceStage = "approved" | "policy" | "payment" | "delivery";

const APPROVED_CARD_SOURCES = [
  "/assets/img/cartao/cartao-s-nome.png",
  "/assets/img/cartao/cartao-s-nome.webp",
  "/assets/img/cartao/cartao-s-nome.jpg",
  "/assets/img/cartao/cartao-s-nome.jpeg",
  "/assets/img/cartao/cartão-s-nome.png",
  "/assets/img/cartao/cartão-s-nome.webp",
  "/assets/img/cartao/cartao-01.png",
] as const;

async function readApiEnvelope<T>(response: Response) {
  const json = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !json?.success) {
    throw new Error(
      json?.success === false
        ? json.error?.message || "Não foi possível processar a emissão."
        : "Não foi possível processar a emissão.",
    );
  }

  return json.data;
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

  if (parts.length >= 2) {
    const firstAndLast = [parts[0], parts[parts.length - 1]].join(" ");
    if (firstAndLast.length <= maxLength) {
      return firstAndLast;
    }
  }

  return fullName.slice(0, maxLength).trim();
}

function formatDeliveryAddress(address: CardIssuanceRequestView["address"]) {
  const line = [address.street, address.number || "S/N", address.complement]
    .filter(Boolean)
    .join(", ");
  const cityLine = [address.neighborhood, address.city, address.state].filter(Boolean).join(" - ");
  const zipCodeLine = address.zipCode ? `CEP ${address.zipCode}` : "";

  return [line, cityLine, zipCodeLine].filter(Boolean).join(" · ");
}

function CardIssuanceLeftPanel() {
  return (
    <aside className="credpagos-card-request-left" aria-label="Resumo do cartão Credpagos">
      <article className="credpagos-card-request-offer">
        <div className="credpagos-card-request-offer__media">
          <Image
            src="/assets/img/cartao/cartao-01.png"
            alt="Cartão Credpagos"
            width={1408}
            height={2271}
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
              <span>Grátis ao gastar R$ 500 por fatura</span>
            </div>
          </div>
        </div>
      </article>
    </aside>
  );
}

export function CardIssuanceFlow({ request }: { request: CardIssuanceRequestView }) {
  const [stage, setStage] = useState<CardIssuanceStage>(request.payment.paid ? "delivery" : "approved");
  const [payment, setPayment] = useState<CardIssuancePaymentView>(request.payment);
  const [approvedCardSourceIndex, setApprovedCardSourceIndex] = useState(0);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [hasAcceptedPolicy, setHasAcceptedPolicy] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copiar");
  const [errorMessage, setErrorMessage] = useState<string | null>(request.payment.error);

  const approvedLimitFormatted = useMemo(() => formatCurrencyBrl(request.approvedLimit), [request.approvedLimit]);
  const approvedCardHolderName = useMemo(() => formatCardHolderName(request.fullName), [request.fullName]);
  const cardDisplayNumber = useMemo(
    () => getCardDisplayNumber(`${request.token}:${request.protocol}:${request.email}`),
    [request.email, request.protocol, request.token],
  );
  const approvedCardSource = APPROVED_CARD_SOURCES[Math.min(approvedCardSourceIndex, APPROVED_CARD_SOURCES.length - 1)];
  const deliveryAddress = useMemo(() => formatDeliveryAddress(request.address), [request.address]);

  async function createPayment(forceNew = false) {
    setStage("payment");
    setIsLoadingPayment(true);
    setCopyLabel("Copiar");
    setErrorMessage(null);

    try {
      const data = await readApiEnvelope<{ payment: CardIssuancePaymentView }>(
        await fetch(`/api/credito/cartao/emissao/${encodeURIComponent(request.token)}/pix`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ forceNew }),
        }),
      );

      setPayment(data.payment);
      if (data.payment.paid) {
        setStage("delivery");
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível gerar o Pix de emissão.");
    } finally {
      setIsLoadingPayment(false);
    }
  }

  async function copyPixCode() {
    if (!payment.copyPaste) {
      return;
    }

    try {
      await navigator.clipboard.writeText(payment.copyPaste);
      setCopyLabel("Copiado");
      window.setTimeout(() => {
        setCopyLabel("Copiar");
      }, 2200);
    } catch {
      setCopyLabel("Copiar");
    }
  }

  useEffect(() => {
    if (stage !== "payment" || !payment.transactionId || payment.paid || payment.failed) {
      return;
    }

    let cancelled = false;
    let isChecking = false;

    async function checkPaymentStatus() {
      if (isChecking) {
        return;
      }

      isChecking = true;

      try {
        const data = await readApiEnvelope<{ payment: CardIssuancePaymentView }>(
          await fetch(`/api/credito/cartao/emissao/${encodeURIComponent(request.token)}/status`, {
            method: "POST",
          }),
        );

        if (cancelled) {
          return;
        }

        setPayment(data.payment);
        if (data.payment.paid) {
          setStage("delivery");
          setErrorMessage(null);
        } else if (data.payment.failed) {
          setErrorMessage("O Pix expirou ou precisa ser gerado novamente para continuar.");
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Não foi possível validar o pagamento Pix agora.");
        }
      } finally {
        isChecking = false;
      }
    }

    void checkPaymentStatus();

    const intervalId = window.setInterval(() => {
      void checkPaymentStatus();
    }, 6_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [payment.failed, payment.paid, payment.transactionId, request.token, stage]);

  if (stage === "delivery") {
    return (
      <div className="credpagos-card-request-shell">
        <CardFlowHeader />

        <section className="credpagos-card-delivery">
          <span className="credpagos-card-delivery__icon" aria-hidden="true">
            <Truck size={30} />
          </span>

          <span className="credpagos-card-delivery__eyebrow">Pagamento confirmado</span>
          <h2>Seu cartão está em emissão</h2>
          <p>
            A emissão foi iniciada com sucesso. O cartão Credpagos está previsto para entrega em até{" "}
            <strong>7 dias úteis</strong> após a emissão do cartão.
          </p>

          <div className="credpagos-card-delivery__panel">
            <div className="credpagos-card-delivery__item">
              <CalendarCheck aria-hidden="true" size={24} />
              <div>
                <strong>Entrega estimada</strong>
                <span>Até 7 dias úteis após a emissão do cartão.</span>
              </div>
            </div>

            <div className="credpagos-card-delivery__item">
              <Mail aria-hidden="true" size={24} />
              <div>
                <strong>Link de rastreio</strong>
                <span>Após o pagamento e despacho do cartão, você receberá o link de rastreio em {request.email}.</span>
              </div>
            </div>
          </div>

          {deliveryAddress ? <small>Endereço de entrega: {deliveryAddress}</small> : null}
        </section>
      </div>
    );
  }

  if (stage === "payment") {
    return (
      <div className="credpagos-card-request-shell">
        <CardFlowHeader />

        <section className="credpagos-card-request">
          <CardIssuanceLeftPanel />

          <div className="credpagos-card-request-right">
            <article className="credpagos-card-pix-panel">
              <h2>Emissão do cartão + frete</h2>
              <p>
                Para confirmar a emissão do cartão Credpagos, realize o pagamento único da taxa de emissão mais o frete
                para entrega. Após a confirmação do pagamento, o cartão entrará em emissão e você receberá o link de
                rastreio quando ele for despachado.
              </p>

              <div className="credpagos-card-pix-summary">
                <ul>
                  {CARD_ISSUANCE_PAYMENT_ITEMS.map((item) => (
                    <li key={item.label}>
                      <span>{item.label}</span>
                      <strong>{formatCurrencyBrl(item.value)}</strong>
                    </li>
                  ))}
                </ul>

                <div className="credpagos-card-pix-summary__total">
                  <span>Valor total:</span>
                  <strong>{formatCurrencyBrl(CARD_ISSUANCE_PAYMENT_TOTAL)}</strong>
                </div>
              </div>

              <div className="credpagos-card-pix-qr">
                {payment.qrCodeImageUrl ? (
                  <Image
                    src={payment.qrCodeImageUrl}
                    alt="QR Code Pix"
                    width={260}
                    height={260}
                    unoptimized
                  />
                ) : (
                  <span className="credpagos-card-pix-qr__placeholder">
                    {isLoadingPayment ? "Gerando QR Code..." : "QR Code indisponível"}
                  </span>
                )}
              </div>

              <div className="credpagos-card-pix-copy">
                <h3>Pagamento via Pix</h3>
                <p>Escaneie o QR Code ou copie o código Pix abaixo para concluir o pagamento.</p>

                <div className="credpagos-card-pix-copy__code">{payment.copyPaste || ""}</div>

                <button
                  type="button"
                  className="credpagos-card-request-button credpagos-card-request-button--active"
                  onClick={copyPixCode}
                  disabled={!payment.copyPaste || isLoadingPayment}
                >
                  <Copy aria-hidden="true" size={20} />
                  {copyLabel}
                </button>

                {errorMessage ? <p className="credpagos-alert credpagos-alert--error">{errorMessage}</p> : null}

                {!payment.paid ? (
                  <button
                    type="button"
                    className="credpagos-card-request-button"
                    onClick={() => void createPayment(true)}
                    disabled={isLoadingPayment}
                  >
                    Gerar novo Pix
                  </button>
                ) : null}

                <div className="credpagos-card-pix-note">
                  <Info aria-hidden="true" size={24} />
                  <div>
                    <p>
                      Após a confirmação do pagamento, a emissão do cartão será liberada automaticamente e o link de
                      rastreio será enviado ao e-mail informado.
                    </p>
                    <small>A confirmação pode levar alguns minutos.</small>
                  </div>
                </div>

                <button
                  type="button"
                  className={`credpagos-card-request-button ${
                    payment.paid ? "credpagos-card-request-button--active" : ""
                  }`}
                  disabled={!payment.paid}
                  onClick={() => setStage("delivery")}
                >
                  Continuar
                  <ChevronRight aria-hidden="true" size={21} />
                </button>
              </div>
            </article>
          </div>
        </section>
      </div>
    );
  }

  if (stage === "policy") {
    return (
      <div className="credpagos-card-request-shell">
        <CardFlowHeader />

        <section className="credpagos-card-issuance-policy">
          <span className="credpagos-card-issuance-policy__icon" aria-hidden="true">
            <FileText size={28} />
          </span>

          <span className="credpagos-card-issuance-policy__eyebrow">Etapa obrigatória</span>
          <h2>Política de emissão, frete e entrega</h2>
          <p className="credpagos-card-issuance-policy__intro">
            Antes de continuar para o pagamento, leia as condições de emissão do cartão Credpagos número{" "}
            <strong>{cardDisplayNumber}</strong>.
          </p>

          <div className="credpagos-card-issuance-policy__body">
            <section>
              <h3>1. Aprovação e limite inicial</h3>
              <p>
                Seu crédito foi aprovado com limite inicial de <strong>{approvedLimitFormatted}</strong>. Esse limite foi
                definido com base nas informações enviadas na análise e pode passar por validação final de dados,
                documentos e condições disponíveis no momento da formalização.
              </p>
            </section>

            <section>
              <h3>2. Emissão do cartão e cobrança</h3>
              <p>
                Para iniciar a emissão do cartão físico, é necessário pagar uma cobrança única composta pela taxa de
                emissão do cartão e pelo frete de entrega. O valor total desta etapa é de{" "}
                <strong>{formatCurrencyBrl(CARD_ISSUANCE_PAYMENT_TOTAL)}</strong>.
              </p>
              <ul>
                {CARD_ISSUANCE_PAYMENT_ITEMS.map((item) => (
                  <li key={item.label}>
                    <span>{item.label}</span>
                    <strong>{formatCurrencyBrl(item.value)}</strong>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3>3. Prazo de entrega</h3>
              <p>
                Após a confirmação do pagamento e a emissão do cartão, a entrega está prevista para ocorrer em até{" "}
                <strong>7 dias úteis</strong>. O prazo pode variar conforme validações operacionais, disponibilidade
                logística e dados de entrega informados.
              </p>
            </section>

            <section>
              <h3>4. Endereço e rastreio</h3>
              <p>
                Ao continuar, você confirma que o endereço abaixo está correto para recebimento do cartão. Após o
                pagamento e o despacho, o link de rastreio será enviado para o e-mail informado na solicitação.
              </p>
              {deliveryAddress ? (
                <div className="credpagos-card-issuance-policy__address">
                  <strong>Endereço de entrega</strong>
                  <span>{deliveryAddress}</span>
                </div>
              ) : null}
            </section>

            <section>
              <h3>5. Continuidade do processo</h3>
              <p>
                A emissão do cartão físico só será iniciada após a confirmação do pagamento. Caso o Pix não seja pago ou
                expire, será necessário gerar uma nova cobrança para continuar.
              </p>
            </section>
          </div>

          <label className="credpagos-card-issuance-policy__accept">
            <input
              type="checkbox"
              checked={hasAcceptedPolicy}
              onChange={(event) => setHasAcceptedPolicy(event.target.checked)}
            />
            <span>
              Li e estou de acordo com a política de emissão, cobrança de emissão + frete, prazo de entrega e envio do
              link de rastreio.
            </span>
          </label>

          {errorMessage ? <p className="credpagos-alert credpagos-alert--error">{errorMessage}</p> : null}

          <button
            type="button"
            className={`credpagos-card-request-button ${
              hasAcceptedPolicy ? "credpagos-card-request-button--active" : ""
            }`}
            onClick={() => void createPayment(false)}
            disabled={!hasAcceptedPolicy || isLoadingPayment}
          >
            {isLoadingPayment ? "Gerando Pix..." : "Concordar e gerar Pix"}
            <ChevronRight aria-hidden="true" size={21} />
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="credpagos-card-request-shell">
      <CardFlowHeader />

      <section className="credpagos-card-approved">
        <span className="credpagos-card-approved__icon" aria-hidden="true">
          <Check size={24} />
        </span>
        <h2>Crédito aprovado</h2>
        <strong>{approvedLimitFormatted}</strong>

        <div className="credpagos-card-approved__card-frame">
          <Image
            src={approvedCardSource}
            alt="Cartão Credpagos"
            width={1408}
            height={2271}
            className="credpagos-card-approved__card"
            unoptimized
            onError={() => {
              setApprovedCardSourceIndex((current) =>
                current < APPROVED_CARD_SOURCES.length - 1 ? current + 1 : current,
              );
            }}
          />
          <span className="credpagos-card-approved__holder-name">{approvedCardHolderName}</span>
          <span className="credpagos-card-approved__card-number">{cardDisplayNumber}</span>
        </div>

        {deliveryAddress ? <small>Endereço de entrega: {deliveryAddress}</small> : null}

        <button
          type="button"
          className="credpagos-card-request-button credpagos-card-request-button--active"
          onClick={() => setStage("policy")}
          disabled={isLoadingPayment}
        >
          Emitir cartão
          <ChevronRight aria-hidden="true" size={21} />
        </button>
      </section>
    </div>
  );
}
