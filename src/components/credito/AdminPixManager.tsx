"use client";

import { useState } from "react";
import type { PixCharge, PixChargeType } from "@prisma/client";
import { PixQRCodeCard } from "@/components/credito/PixQRCodeCard";

type ApplicationOption = {
  id: string;
  protocol: string;
  customerName: string;
};

type AdminPixManagerProps = {
  applications: ApplicationOption[];
  initialCharges: PixCharge[];
};

type ApiResponse = {
  success: boolean;
  data?: {
    charge: PixCharge;
  };
  error?: {
    message?: string;
  };
};

const PIX_TYPES: PixCharge["type"][] = [
  "INSTALLMENT",
  "SETTLEMENT",
  "CONTRACT_ENTRY",
  "ADMIN_FEE",
];

export function AdminPixManager({
  applications,
  initialCharges,
}: AdminPixManagerProps) {
  const [applicationId, setApplicationId] = useState(applications[0]?.id ?? "");
  const [type, setType] = useState<PixChargeType>("INSTALLMENT");
  const [amount, setAmount] = useState(100);
  const [description, setDescription] = useState("Parcela contratual");
  const [charges, setCharges] = useState<PixCharge[]>(initialCharges);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function createCharge() {
    if (!applicationId) {
      setMessage("Selecione uma solicitação.");
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/credito/solicitacoes/${applicationId}/pix`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount,
            type,
            description,
          }),
        }
      );

      const payload = (await response.json()) as ApiResponse;

      if (!response.ok || !payload.success || !payload.data?.charge) {
        setMessage(
          payload.error?.message ?? "Não foi possível criar a cobrança Pix."
        );
        return;
      }

      setCharges((current) => [payload.data!.charge, ...current]);
      setMessage("Cobrança Pix criada com sucesso.");
    } catch {
      setMessage("Falha ao criar a cobrança Pix.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="credpagos-admin-dashboard">
      <article className="credpagos-status-card">
        <h2 className="credpagos-credito-card-title">Nova cobrança Pix</h2>

        <div className="credpagos-form-grid">
          <label className="credpagos-form-group">
            <span className="credpagos-form-label">Solicitação</span>
            <select
              className="credpagos-form-select"
              value={applicationId}
              onChange={(event) => setApplicationId(event.target.value)}
            >
              {applications.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.protocol} - {item.customerName}
                </option>
              ))}
            </select>
          </label>

          <label className="credpagos-form-group">
            <span className="credpagos-form-label">Tipo</span>
            <select
              className="credpagos-form-select"
              value={type}
              onChange={(event) => setType(event.target.value as PixChargeType)}
            >
              {PIX_TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="credpagos-form-group">
            <span className="credpagos-form-label">Valor</span>
            <input
              className="credpagos-form-input"
              type="number"
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
            />
          </label>

          <label className="credpagos-form-group">
            <span className="credpagos-form-label">Descrição</span>
            <input
              className="credpagos-form-input"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
        </div>

        <button
          type="button"
          className="credpagos-credito-button credpagos-credito-button--primary"
          disabled={isLoading}
          onClick={() => {
            void createCharge();
          }}
        >
          {isLoading ? "Gerando..." : "Gerar cobrança"}
        </button>

        {message ? <p className="credpagos-alert">{message}</p> : null}
      </article>

      <div className="credpagos-credito-grid">
        {charges.map((charge) => (
          <PixQRCodeCard key={charge.id} charge={charge} />
        ))}
      </div>
    </div>
  );
}