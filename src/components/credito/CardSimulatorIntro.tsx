"use client";

import Image from "next/image";
import { BadgeDollarSign, Grid3X3 } from "lucide-react";
import { CardFlowHeader } from "@/components/credito/CardFlowHeader";

type CardSimulatorIntroProps = {
  cpf: string;
  onCpfChange: (cpf: string) => void;
  onSubmit: () => void;
};

function getCpfDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

function formatCpf(value: string) {
  const digits = getCpfDigits(value);
  const first = digits.slice(0, 3);
  const second = digits.slice(3, 6);
  const third = digits.slice(6, 9);
  const verifier = digits.slice(9, 11);

  if (digits.length > 9) {
    return `${first}.${second}.${third}-${verifier}`;
  }

  if (digits.length > 6) {
    return `${first}.${second}.${third}`;
  }

  if (digits.length > 3) {
    return `${first}.${second}`;
  }

  return first;
}

export function CardSimulatorIntro({
  cpf,
  onCpfChange,
  onSubmit,
}: CardSimulatorIntroProps) {
  const cpfDigits = getCpfDigits(cpf);
  const canSubmit = cpfDigits.length === 11;

  return (
    <>
      <CardFlowHeader />

      <section
        className="credpagos-card-simulator"
        aria-labelledby="credpagos-card-simulator-title"
      >
        <div className="credpagos-card-simulator__details">
          <h1 id="credpagos-card-simulator-title">Cred Gold</h1>


          <div className="credpagos-card-benefits" aria-label="Beneficios do cartao">
            <div className="credpagos-card-benefit-row">
              <div className="credpagos-card-benefit-label">
                <Grid3X3 aria-hidden="true" size={22} strokeWidth={2.4} />
                <span>Pontuação</span>
              </div>
              <strong>
                Até 2 pontos por
                <br />1 dólar gasto
              </strong>
            </div>

            <div className="credpagos-card-benefit-row">
              <div className="credpagos-card-benefit-label">
                <BadgeDollarSign aria-hidden="true" size={22} strokeWidth={2.2} />
                <span>Mensalidade</span>
              </div>
              <strong>
                Grátis ao gastar
                <br />
                R$ 500 por fatura
              </strong>
            </div>
          </div>
        </div>

        <div className="credpagos-card-simulator__media">
          <div className="credpagos-card-image-slot">
            <Image
              src="/assets/img/cartao/cart%C3%A3o.png"
              alt="Cartao CredPagos Azul Gold"
              width={3750}
              height={2500}
              className="credpagos-card-image"
              priority
            />
          </div>
        </div>

        <form
          className="credpagos-card-simulator__form-card"
          onSubmit={(event) => {
            event.preventDefault();

            if (canSubmit) {
              onSubmit();
            }
          }}
        >
          <h2>Seu novo cartão em minutos</h2>
          <label htmlFor="credpagos-card-cpf">CPF</label>
          <input
            id="credpagos-card-cpf"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={formatCpf(cpf)}
            onChange={(event) => onCpfChange(getCpfDigits(event.target.value))}
          />
          <button type="submit" disabled={!canSubmit}>
            Pedir cartão
          </button>
        </form>
      </section>
    </>
  );
}
