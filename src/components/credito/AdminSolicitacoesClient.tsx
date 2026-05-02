"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminCreditFilters } from "@/components/credito/AdminCreditFilters";
import { AdminCreditTable } from "@/components/credito/AdminCreditTable";

type AdminApplicationRow = {
  id: string;
  protocol: string;
  profileType: string;
  status:
    | "DRAFT"
    | "SUBMITTED"
    | "IN_ANALYSIS"
    | "DOCUMENTS_PENDING"
    | "PRE_APPROVED"
    | "PROPOSAL_AVAILABLE"
    | "PROPOSAL_ACCEPTED"
    | "CONTRACT_GENERATED"
    | "CONTRACT_SIGNED"
    | "AWAITING_RELEASE"
    | "CREDIT_RELEASED"
    | "REFUSED"
    | "CANCELED";
  requestedAmount: number;
  estimatedNetAmount: number;
  createdAt: string | Date;
  customer?: {
    name: string;
    document: string;
  };
  analysis?: {
    score: number;
    riskLevel: string;
  } | null;
};

type ApiResponse = {
  success: boolean;
  data?: {
    items: AdminApplicationRow[];
  };
  error?: {
    message?: string;
  };
};

type AdminSolicitacoesClientProps = {
  initialItems: AdminApplicationRow[];
};

export function AdminSolicitacoesClient({
  initialItems,
}: AdminSolicitacoesClientProps) {
  const [items, setItems] = useState<AdminApplicationRow[]>(initialItems);
  const [query, setQuery] = useState("");
  const [profileType, setProfileType] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const params = useMemo(() => {
    const search = new URLSearchParams();

    if (query.trim()) {
      search.set("q", query.trim());
    }

    if (profileType) {
      search.set("profileType", profileType);
    }

    if (status) {
      search.set("status", status);
    }

    search.set("pageSize", "60");

    return search.toString();
  }, [profileType, query, status]);

  useEffect(() => {
    let active = true;

    setIsLoading(true);
    setMessage(null);

    fetch(`/api/credito/solicitacoes?${params}`)
      .then((response) =>
        response.json().then((payload) => ({
          response,
          payload: payload as ApiResponse,
        }))
      )
      .then(({ response, payload }) => {
        if (!active) {
          return;
        }

        if (!response.ok || !payload.success || !payload.data) {
          setMessage(
            payload.error?.message ??
              "Não foi possível carregar as solicitações."
          );
          return;
        }

        setItems(payload.data.items);
      })
      .catch(() => {
        if (active) {
          setMessage("Falha ao consultar as solicitações.");
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [params]);

  return (
    <div className="credpagos-admin-dashboard">
      <AdminCreditFilters
        query={query}
        profileType={profileType}
        status={status}
        onChange={(next) => {
          if (typeof next.query === "string") {
            setQuery(next.query);
          }

          if (typeof next.profileType === "string") {
            setProfileType(next.profileType);
          }

          if (typeof next.status === "string") {
            setStatus(next.status);
          }
        }}
      />

      {isLoading ? (
        <p className="credpagos-alert">Carregando as solicitações...</p>
      ) : null}

      {message ? (
        <p className="credpagos-alert credpagos-alert--error">{message}</p>
      ) : null}

      <AdminCreditTable items={items} />
    </div>
  );
}