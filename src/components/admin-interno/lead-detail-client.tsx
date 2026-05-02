"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  INTERNAL_PRIORITY_LABEL,
  INTERNAL_STATUS_LABEL,
} from "@/lib/admin-interno/constants";

type InternalLeadStatus =
  | "NOVO"
  | "EM_ANALISE"
  | "CONTATADO"
  | "QUALIFICADO"
  | "CONVERTIDO"
  | "PERDIDO"
  | "SPAM";

type InternalLeadPriority = "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";

type LeadDetailClientProps = {
  leadId: string;
  canUpdate: boolean;
  canAssign: boolean;
  canAddNote: boolean;
  assignees: Array<{
    id: string;
    fullName: string;
  }>;
  currentStatus: InternalLeadStatus;
  currentPriority: InternalLeadPriority;
  currentAssigneeId: string | null;
};

const STATUS_OPTIONS: InternalLeadStatus[] = [
  "NOVO",
  "EM_ANALISE",
  "CONTATADO",
  "QUALIFICADO",
  "CONVERTIDO",
  "PERDIDO",
  "SPAM",
];

const PRIORITY_OPTIONS: InternalLeadPriority[] = ["BAIXA", "MEDIA", "ALTA", "URGENTE"];

function readCookie(name: string) {
  const found = document.cookie
    .split(";")
    .map((value) => value.trim())
    .find((item) => item.startsWith(`${name}=`));

  return found ? decodeURIComponent(found.slice(name.length + 1)) : "";
}

export function LeadDetailClient(props: LeadDetailClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState<InternalLeadStatus>(props.currentStatus);
  const [priority, setPriority] = useState<InternalLeadPriority>(props.currentPriority);
  const [assigneeId, setAssigneeId] = useState<string>(props.currentAssigneeId ?? "");
  const [note, setNote] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!props.canUpdate || isSaving) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch(`/admin-interno/api/leads/${props.leadId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-admin-csrf-token": readCookie("credpago_internal_admin_csrf"),
        },
        body: JSON.stringify({
          status,
          priority,
          ...(props.canAssign ? { assigneeId: assigneeId || null } : {}),
        }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        setError(result?.error?.message ?? "Falha ao atualizar lead.");
        return;
      }

      setFeedback("Lead atualizado com sucesso.");
      router.refresh();
    } catch {
      setError("Falha de conexão ao atualizar lead.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!props.canAddNote || !note.trim() || isSaving) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch(`/admin-interno/api/leads/${props.leadId}/notes`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-admin-csrf-token": readCookie("credpago_internal_admin_csrf"),
        },
        body: JSON.stringify({
          note,
        }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        setError(result?.error?.message ?? "Falha ao adicionar observação.");
        return;
      }

      setNote("");
      setFeedback("Observação adicionada.");
      router.refresh();
    } catch {
      setError("Falha de conexão ao adicionar observação.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="admin-detail-actions">
      <form className="admin-card" onSubmit={handleUpdate}>
        <h3>Atualizar lead</h3>

        <label>
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value as InternalLeadStatus)}>
            {STATUS_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {INTERNAL_STATUS_LABEL[item]}
              </option>
            ))}
          </select>
        </label>

        <label>
          Prioridade
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as InternalLeadPriority)}
          >
            {PRIORITY_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {INTERNAL_PRIORITY_LABEL[item]}
              </option>
            ))}
          </select>
        </label>

        {props.canAssign ? (
          <label>
            Responsável
            <select value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}>
              <option value="">Não atribuído</option>
              {props.assignees.map((assignee) => (
                <option key={assignee.id} value={assignee.id}>
                  {assignee.fullName}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <button type="submit" className="admin-primary-button" disabled={!props.canUpdate || isSaving}>
          {isSaving ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>

      <form className="admin-card" onSubmit={handleAddNote}>
        <h3>Observações internas</h3>
        <label>
          Nova observação
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={5000}
            rows={6}
            placeholder="Adicione contexto interno sobre este lead"
          />
        </label>

        <button type="submit" className="admin-primary-button" disabled={!props.canAddNote || isSaving}>
          {isSaving ? "Enviando..." : "Adicionar observação"}
        </button>
      </form>

      {feedback ? <p className="admin-feedback success">{feedback}</p> : null}
      {error ? <p className="admin-feedback error">{error}</p> : null}
    </div>
  );
}