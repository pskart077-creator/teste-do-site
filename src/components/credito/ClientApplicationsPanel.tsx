"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  CreditApplication,
  CreditContract,
  CreditProposal,
} from "@prisma/client";
import { ContractPreview } from "@/components/credito/ContractPreview";
import { CreditStatusBadge } from "@/components/credito/CreditStatusBadge";
import { CreditTimeline } from "@/components/credito/CreditTimeline";
import { ProposalCard } from "@/components/credito/ProposalCard";
import { formatCurrencyBrl } from "@/lib/credit/helpers";

type ApplicationWithRelations = CreditApplication & {
  proposals: CreditProposal[];
  contracts: CreditContract[];
  history: Array<{
    id: string;
    toStatus: CreditApplication["status"];
    note: string | null;
    createdAt: Date;
  }>;
};

type ClientApplicationsPanelProps = {
  applications: ApplicationWithRelations[];
};

type BusyMap = Record<string, boolean>;
type ContractAcceptedMap = Record<string, boolean>;

type ApiResponse = {
  success: boolean;
  error?: { message?: string };
};

export function ClientApplicationsPanel({
  applications,
}: ClientApplicationsPanelProps) {
  const router = useRouter();
  const [busyMap, setBusyMap] = useState<BusyMap>({});
  const [acceptedMap, setAcceptedMap] = useState<ContractAcceptedMap>({});
  const [message, setMessage] = useState<string | null>(null);

  const applicationsById = useMemo(() => {
    return applications.reduce<Record<string, ApplicationWithRelations>>(
      (acc, app) => {
        acc[app.id] = app;
        return acc;
      },
      {}
    );
  }, [applications]);

  async function patchProposal(appId: string, action: "accept" | "reject") {
    setBusyMap((current) => ({ ...current, [appId]: true }));
    setMessage(null);

    try {
      const response = await fetch(
        `/api/credito/solicitacoes/${appId}/proposta`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }
      );

      const payload = (await response.json()) as ApiResponse;

      if (!response.ok || !payload.success) {
        setMessage(
          payload.error?.message ?? "Não foi possível atualizar a proposta."
        );
        return;
      }

      router.refresh();
    } catch {
      setMessage("Falha ao atualizar a proposta.");
    } finally {
      setBusyMap((current) => ({ ...current, [appId]: false }));
    }
  }

  async function acceptContract(appId: string) {
    if (!acceptedMap[appId]) {
      setMessage("Confirme o aceite do contrato para continuar.");
      return;
    }

    setBusyMap((current) => ({ ...current, [appId]: true }));
    setMessage(null);

    try {
      const response = await fetch(
        `/api/credito/solicitacoes/${appId}/contrato/aceite`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accepted: true }),
        }
      );

      const payload = (await response.json()) as ApiResponse;

      if (!response.ok || !payload.success) {
        setMessage(
          payload.error?.message ?? "Não foi possível assinar o contrato."
        );
        return;
      }

      router.refresh();
    } catch {
      setMessage("Falha ao confirmar o aceite do contrato.");
    } finally {
      setBusyMap((current) => ({ ...current, [appId]: false }));
    }
  }

  if (!applications.length) {
    return (
      <div className="credpagos-empty">
        Você ainda não possui solicitações cadastradas.
      </div>
    );
  }

  return (
    <div className="credpagos-credito-grid">
      {message ? (
        <div className="credpagos-alert credpagos-alert--error">
          {message}
        </div>
      ) : null}

      {applications.map((application) => {
        const proposal = application.proposals[0] ?? null;
        const contract = application.contracts[0] ?? null;
        const isBusy = Boolean(busyMap[application.id]);
        const accepted = Boolean(acceptedMap[application.id]);
        const app = applicationsById[application.id];

        return (
          <article className="credpagos-status-card" key={application.id}>
            <div className="credpagos-key-value">
              <span>Protocolo</span>
              <strong>{application.protocol}</strong>
            </div>

            <div className="credpagos-key-value">
              <span>Perfil</span>
              <strong>{application.profileType}</strong>
            </div>

            <div className="credpagos-key-value">
              <span>Valor solicitado</span>
              <strong>{formatCurrencyBrl(application.requestedAmount)}</strong>
            </div>

            <div className="credpagos-key-value">
              <span>Valor líquido estimado</span>
              <strong>
                {formatCurrencyBrl(application.estimatedNetAmount)}
              </strong>
            </div>

            <div className="credpagos-key-value">
              <span>Status</span>
              <strong>
                <CreditStatusBadge status={application.status} />
              </strong>
            </div>

            <CreditTimeline
              currentStatus={application.status}
              history={app.history}
            />

            {proposal?.status === "AVAILABLE" ? (
              <ProposalCard
                proposal={proposal}
                isBusy={isBusy}
                onAccept={() => {
                  void patchProposal(application.id, "accept");
                }}
                onReject={() => {
                  void patchProposal(application.id, "reject");
                }}
              />
            ) : null}

            {contract?.status === "AVAILABLE" ? (
              <ContractPreview
                contract={contract}
                accepted={accepted}
                isBusy={isBusy}
                onAcceptedChange={(value) =>
                  setAcceptedMap((current) => ({
                    ...current,
                    [application.id]: value,
                  }))
                }
                onAcceptContract={() => {
                  void acceptContract(application.id);
                }}
              />
            ) : null}
          </article>
        );
      })}
    </div>
  );
}