"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AdminApplicationActionsProps = {
  applicationId: string;
};

type ApiResponse = {
  success: boolean;
  error?: {
    message?: string;
  };
};

const ACTIONS: Array<{
  label: string;
  status:
    | "IN_ANALYSIS"
    | "DOCUMENTS_PENDING"
    | "PRE_APPROVED"
    | "PROPOSAL_AVAILABLE"
    | "CONTRACT_GENERATED"
    | "AWAITING_RELEASE"
    | "CREDIT_RELEASED"
    | "REFUSED"
    | "CANCELED";
}> = [
  { label: "Mover para análise", status: "IN_ANALYSIS" },
  { label: "Solicitar documentos", status: "DOCUMENTS_PENDING" },
  { label: "Pré-aprovar", status: "PRE_APPROVED" },
  { label: "Gerar proposta", status: "PROPOSAL_AVAILABLE" },
  { label: "Gerar contrato", status: "CONTRACT_GENERATED" },
  { label: "Aguardando liberação", status: "AWAITING_RELEASE" },
  { label: "Confirmar liberação", status: "CREDIT_RELEASED" },
  { label: "Recusar", status: "REFUSED" },
  { label: "Cancelar", status: "CANCELED" },
];

export function AdminApplicationActions({
  applicationId,
}: AdminApplicationActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function patchStatus(nextStatus: (typeof ACTIONS)[number]["status"]) {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/credito/solicitacoes/${applicationId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ toStatus: nextStatus }),
        }
      );

      const payload = (await response.json()) as ApiResponse;

      if (!response.ok || !payload.success) {
        setMessage(
          payload.error?.message ?? "Não foi possível atualizar o status."
        );
        return;
      }

      router.refresh();
    } catch {
      setMessage("Falha ao atualizar o status.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="credpagos-status-card">
      <h3 className="credpagos-credito-card-title">Ações rápidas</h3>

      <div className="credpagos-admin-actions">
        {ACTIONS.map((action) => (
          <button
            key={action.status}
            type="button"
            className="credpagos-credito-button credpagos-credito-button--ghost"
            disabled={isLoading}
            onClick={() => {
              void patchStatus(action.status);
            }}
          >
            {action.label}
          </button>
        ))}
      </div>

      {message ? (
        <p className="credpagos-alert credpagos-alert--error">{message}</p>
      ) : null}
    </div>
  );
}