"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { BadgeDollarSign, ChevronLeft, ChevronRight, Grid3X3 } from "lucide-react";
import { CardFlowHeader } from "@/components/credito/CardFlowHeader";

type CardApplicationStepProps = {
  children: ReactNode;
  globalMessage?: string | null;
  canGoBack: boolean;
  canContinue: boolean;
  continueLabel: string;
  onBack: () => void;
  onContinue: () => void;
};

export function CardApplicationStep({
  children,
  globalMessage,
  canGoBack,
  canContinue,
  continueLabel,
  onBack,
  onContinue,
}: CardApplicationStepProps) {
  return (
    <>
      <CardFlowHeader />

      <section className="credpagos-card-application" aria-labelledby="credpagos-card-application-title">
        <div className="credpagos-card-application__summary">
          <div className="credpagos-card-application__summary-inner">
            <h1 id="credpagos-card-application-title">
              Complete os dados para o pedido do cartão Cred Gold Mastercard
            </h1>

            <article className="credpagos-card-application-preview" aria-label="Resumo do cartão Cred Gold">
              <div className="credpagos-card-application-preview__media" aria-hidden="true">
                <Image
                  src="/assets/img/cartao/cartao-01.png"
                  alt=""
                  width={2271}
                  height={1408}
                  className="credpagos-card-application-preview__image"
                />
              </div>

              <div className="credpagos-card-application-preview__benefits">
                <div className="credpagos-card-application-preview__row">
                  <Grid3X3 aria-hidden="true" size={14} strokeWidth={2.4} />
                  <div>
                    <strong>Pontuação</strong>
                    <span>Até 3,5 pontos por 1 dólar gasto</span>
                  </div>
                </div>

                <div className="credpagos-card-application-preview__row">
                  <BadgeDollarSign aria-hidden="true" size={14} strokeWidth={2.2} />
                  <div>
                    <strong>Mensalidade</strong>
                    <span>Grátis ao gastar R$ 500 por fatura</span>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>

        <div className="credpagos-card-application__form-side">
          <div className="credpagos-card-application__form">
            {children}
            {globalMessage ? <p className="credpagos-alert credpagos-alert--error">{globalMessage}</p> : null}
          </div>

          <div className="credpagos-card-application__actions">
            {canGoBack ? (
              <button
                type="button"
                className="credpagos-card-application__back"
                onClick={onBack}
              >
                <ChevronLeft aria-hidden="true" size={13} strokeWidth={2.4} />
                Voltar
              </button>
            ) : null}

            <button
              type="button"
              className="credpagos-card-application__continue"
              disabled={!canContinue}
              onClick={onContinue}
            >
              {continueLabel}
              <ChevronRight aria-hidden="true" size={14} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
