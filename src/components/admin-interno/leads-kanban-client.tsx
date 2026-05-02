"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  INTERNAL_PRIORITY_LABEL,
  INTERNAL_STATUS_LABEL,
} from "@/lib/admin-interno/constants";
import { getLeadEmailDisplay } from "@/lib/admin-interno/lead-email";

type InternalLeadStatus =
  | "NOVO"
  | "EM_ANALISE"
  | "CONTATADO"
  | "QUALIFICADO"
  | "CONVERTIDO"
  | "PERDIDO"
  | "SPAM";

type InternalLeadPriority = "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";

type KanbanLead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  source: string | null;
  status: InternalLeadStatus;
  priority: InternalLeadPriority;
  createdAt: string;
  assignee: {
    id: string;
    fullName: string;
  } | null;
};

type LeadsKanbanClientProps = {
  leads: KanbanLead[];
  canUpdate: boolean;
};

const STATUS_ORDER: InternalLeadStatus[] = [
  "NOVO",
  "EM_ANALISE",
  "CONTATADO",
  "QUALIFICADO",
  "CONVERTIDO",
  "PERDIDO",
  "SPAM",
];

function readCookie(name: string) {
  const found = document.cookie
    .split(";")
    .map((value) => value.trim())
    .find((item) => item.startsWith(`${name}=`));

  return found ? decodeURIComponent(found.slice(name.length + 1)) : "";
}

export function LeadsKanbanClient({ leads: initialLeads, canUpdate }: LeadsKanbanClientProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);
  const [isSavingLeadId, setIsSavingLeadId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [error, setError] = useState<string | null>(null);

  const assignees = useMemo(() => {
    const map = new Map<string, string>();
    for (const lead of leads) {
      if (lead.assignee?.id && lead.assignee.fullName) {
        map.set(lead.assignee.id, lead.assignee.fullName);
      }
    }

    return Array.from(map.entries())
      .map(([id, fullName]) => ({ id, fullName }))
      .sort((a, b) => a.fullName.localeCompare(b.fullName, "pt-BR"));
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const term = query.trim().toLowerCase();

    return leads.filter((lead) => {
      if (assigneeFilter === "__unassigned__" && lead.assignee) {
        return false;
      }

      if (assigneeFilter && assigneeFilter !== "__unassigned__" && lead.assignee?.id !== assigneeFilter) {
        return false;
      }

      if (!term) {
        return true;
      }

      const fields = [
        lead.name,
        lead.email,
        lead.phone ?? "",
        lead.company ?? "",
        lead.source ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return fields.includes(term);
    });
  }, [assigneeFilter, leads, query]);

  const columns = useMemo(() => {
    const byStatus = Object.fromEntries(
      STATUS_ORDER.map((status) => [status, [] as KanbanLead[]]),
    ) as Record<InternalLeadStatus, KanbanLead[]>;

    for (const lead of filteredLeads) {
      byStatus[lead.status].push(lead);
    }

    return byStatus;
  }, [filteredLeads]);

  async function persistStatus(leadId: string, nextStatus: InternalLeadStatus) {
    if (!canUpdate) {
      return;
    }

    const current = leads.find((lead) => lead.id === leadId);
    if (!current || current.status === nextStatus) {
      return;
    }

    setError(null);
    setIsSavingLeadId(leadId);

    setLeads((previous) =>
      previous.map((lead) => (lead.id === leadId ? { ...lead, status: nextStatus } : lead)),
    );

    try {
      const response = await fetch(`/admin-interno/api/leads/${leadId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-admin-csrf-token": readCookie("credpago_internal_admin_csrf"),
        },
        body: JSON.stringify({
          status: nextStatus,
        }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error?.message ?? "Falha ao mover lead.");
      }
    } catch (reason) {
      setLeads((previous) =>
        previous.map((lead) => (lead.id === leadId ? { ...lead, status: current.status } : lead)),
      );
      setError(reason instanceof Error ? reason.message : "Falha ao mover lead.");
    } finally {
      setIsSavingLeadId((previous) => (previous === leadId ? null : previous));
    }
  }

  function onDragStart(leadId: string) {
    setDraggingLeadId(leadId);
  }

  function onDragEnd() {
    setDraggingLeadId(null);
  }

  function onDrop(columnStatus: InternalLeadStatus) {
    if (!canUpdate || !draggingLeadId) {
      return;
    }

    void persistStatus(draggingLeadId, columnStatus);
    setDraggingLeadId(null);
  }

  return (
    <div className="admin-page-stack">
      <section className="admin-card">
        <div className="admin-card-header">
          <h2>Kanban de leads</h2>
          <span>{filteredLeads.length} leads exibidos</span>
        </div>

        <div className="admin-kanban-toolbar">
          <label>
            Buscar
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nome, e-mail, telefone ou empresa"
            />
          </label>

          <label>
            Responsável
            <select
              value={assigneeFilter}
              onChange={(event) => setAssigneeFilter(event.target.value)}
            >
              <option value="">Todos</option>
              <option value="__unassigned__">Não atribuído</option>
              {assignees.map((assignee) => (
                <option key={assignee.id} value={assignee.id}>
                  {assignee.fullName}
                </option>
              ))}
            </select>
          </label>
        </div>

        {!canUpdate ? (
          <p className="admin-feedback">
            Seu perfil possui visualização apenas. Arrastar e alterar status está desabilitado.
          </p>
        ) : null}

        {error ? <p className="admin-feedback error">{error}</p> : null}

        <div className="admin-kanban-board">
          {STATUS_ORDER.map((status) => (
            <section
              key={status}
              className={canUpdate ? "admin-kanban-column is-droppable" : "admin-kanban-column"}
              onDragOver={(event) => {
                if (canUpdate) {
                  event.preventDefault();
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                onDrop(status);
              }}
            >
              <header className="admin-kanban-column-header">
                <h3>{INTERNAL_STATUS_LABEL[status]}</h3>
                <span>{columns[status].length}</span>
              </header>

              <div className="admin-kanban-column-body">
                {columns[status].map((lead) => (
                  <article
                    key={lead.id}
                    className={
                      draggingLeadId === lead.id
                        ? "admin-kanban-card is-dragging"
                        : "admin-kanban-card"
                    }
                    draggable={canUpdate}
                    onDragStart={() => onDragStart(lead.id)}
                    onDragEnd={onDragEnd}
                  >
                    <div className="admin-kanban-card-top">
                      <strong>{lead.name}</strong>
                      <small>{INTERNAL_PRIORITY_LABEL[lead.priority]}</small>
                    </div>

                    <p>{getLeadEmailDisplay(lead.email)}</p>

                    <div className="admin-kanban-card-meta">
                      <span>{lead.company ?? "Sem empresa"}</span>
                      <span>{lead.source ?? "Sem origem"}</span>
                    </div>

                    <div className="admin-kanban-card-footer">
                      <small>{lead.assignee?.fullName ?? "Não atribuído"}</small>
                      <small>{new Date(lead.createdAt).toLocaleDateString("pt-BR")}</small>
                    </div>

                    {canUpdate ? (
                      <label className="admin-kanban-status-select">
                        Mover para
                        <select
                          value={lead.status}
                          disabled={isSavingLeadId === lead.id}
                          onChange={(event) =>
                            void persistStatus(lead.id, event.target.value as InternalLeadStatus)
                          }
                        >
                          {STATUS_ORDER.map((option) => (
                            <option key={option} value={option}>
                              {INTERNAL_STATUS_LABEL[option]}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}

                    <Link className="admin-inline-link" href={`/admin-interno/leads/${lead.id}`}>
                      Ver detalhes
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}
