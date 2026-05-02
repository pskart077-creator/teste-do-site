import { notFound } from "next/navigation";
import { LeadDetailClient } from "@/components/admin-interno/lead-detail-client";
import { requireInternalPageSession } from "@/lib/admin-interno/auth";
import {
  INTERNAL_PRIORITY_LABEL,
  INTERNAL_STATUS_LABEL,
} from "@/lib/admin-interno/constants";
import { getLeadEmailDisplay } from "@/lib/admin-interno/lead-email";
import { getLeadById } from "@/lib/admin-interno/leads";
import { hasPermission } from "@/lib/admin-interno/permissions";
import { writeAuditLog } from "@/lib/admin-interno/audit";
import { prisma } from "@/lib/db/prisma";

export default async function InternalLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireInternalPageSession("leads:read");
  const { id } = await params;

  const lead = await getLeadById(id);
  if (!lead) {
    notFound();
  }

  await writeAuditLog({
    actorId: session.userId,
    action: "LEAD_VIEWED",
    entityType: "lead",
    entityId: lead.id,
  });

  const canUpdate = hasPermission(session.role, "leads:update");
  const canAssign = hasPermission(session.role, "leads:assign");
  const canAddNote = hasPermission(session.role, "leads:note");

  const assignees = canAssign
    ? await prisma.internalAdminUser.findMany({
        where: {
          isActive: true,
          deletedAt: null,
        },
        select: {
          id: true,
          fullName: true,
        },
        orderBy: {
          fullName: "asc",
        },
      })
    : [];

  return (
    <div className="admin-page-stack">
      <section className="admin-card admin-lead-summary">
        <h2>Lead {lead.name}</h2>
        <div className="admin-summary-grid">
          <div>
            <strong>E-mail</strong>
            <p>{getLeadEmailDisplay(lead.email)}</p>
          </div>
          <div>
            <strong>Telefone</strong>
            <p>{lead.phone || "-"}</p>
          </div>
          <div>
            <strong>Empresa</strong>
            <p>{lead.company || "-"}</p>
          </div>
          <div>
            <strong>Status</strong>
            <p>{INTERNAL_STATUS_LABEL[lead.status]}</p>
          </div>
          <div>
            <strong>Prioridade</strong>
            <p>{INTERNAL_PRIORITY_LABEL[lead.priority]}</p>
          </div>
          <div>
            <strong>Responsável</strong>
            <p>{lead.assignee?.fullName ?? "Não atribuído"}</p>
          </div>
          <div>
            <strong>Origem</strong>
            <p>{lead.source || "-"}</p>
          </div>
          <div>
            <strong>Página de origem</strong>
            <p>{lead.sourcePage || "-"}</p>
          </div>
          <div>
            <strong>Campanha</strong>
            <p>{lead.campaign || "-"}</p>
          </div>
          <div>
            <strong>UTMs</strong>
            <p>
              {lead.utmSource || "-"} / {lead.utmMedium || "-"} / {lead.utmCampaign || "-"}
            </p>
          </div>
          <div>
            <strong>Criado em</strong>
            <p>{lead.createdAt.toLocaleString("pt-BR")}</p>
          </div>
          <div>
            <strong>Atualizado em</strong>
            <p>{lead.updatedAt.toLocaleString("pt-BR")}</p>
          </div>
        </div>

        <div className="admin-message-block">
          <strong>Mensagem</strong>
          <p>{lead.message || "Sem mensagem"}</p>
        </div>

        <div className="admin-tags-inline">
          <strong>Tags</strong>
          <div>
            {lead.tags.length
              ? lead.tags.map((relation) => (
                  <span key={relation.id} className="admin-tag-chip">
                    {relation.tag.name}
                  </span>
                ))
              : "Sem tags"}
          </div>
        </div>
      </section>

      <LeadDetailClient
        leadId={lead.id}
        canUpdate={canUpdate}
        canAssign={canAssign}
        canAddNote={canAddNote}
        assignees={assignees}
        currentStatus={lead.status}
        currentPriority={lead.priority}
        currentAssigneeId={lead.assigneeId}
      />

      <section className="admin-card">
        <h3>Histórico de movimentação</h3>
        <ul className="admin-history-list">
          {lead.history.map((item) => (
            <li key={item.id}>
              <div>
                <strong>{item.action}</strong>
                <p>
                  {item.changedBy?.fullName ?? "Sistema"} em {item.createdAt.toLocaleString("pt-BR")}
                </p>
              </div>
              <div>
                {item.fromStatus || item.toStatus ? (
                  <p>
                    Status: {item.fromStatus ? INTERNAL_STATUS_LABEL[item.fromStatus] : "-"} -&gt;{" "}
                    {item.toStatus ? INTERNAL_STATUS_LABEL[item.toStatus] : "-"}
                  </p>
                ) : null}
                {item.fromPriority || item.toPriority ? (
                  <p>
                    Prioridade: {item.fromPriority ? INTERNAL_PRIORITY_LABEL[item.fromPriority] : "-"} -&gt;{" "}
                    {item.toPriority ? INTERNAL_PRIORITY_LABEL[item.toPriority] : "-"}
                  </p>
                ) : null}
                {item.note ? <p>Nota: {item.note}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-card">
        <h3>Observações internas</h3>
        <ul className="admin-notes-list">
          {lead.notes.map((note) => (
            <li key={note.id}>
              <p>{note.note}</p>
              <small>
                {note.author.fullName} em {note.createdAt.toLocaleString("pt-BR")}
              </small>
            </li>
          ))}
          {!lead.notes.length ? <li>Nenhuma observação registrada.</li> : null}
        </ul>
      </section>

      <section className="admin-card">
        <h3>Logs de notificação</h3>
        <ul className="admin-history-list">
          {lead.notifications.map((notification) => (
            <li key={notification.id}>
              <div>
                <strong>{notification.recipient.email}</strong>
                <p>Status: {notification.status}</p>
              </div>
              <div>
                <p>Tentativa: {notification.attempt}</p>
                <p>{notification.sentAt ? notification.sentAt.toLocaleString("pt-BR") : "Sem envio"}</p>
                {notification.errorMessage ? <p>Erro: {notification.errorMessage}</p> : null}
              </div>
            </li>
          ))}
          {!lead.notifications.length ? <li>Sem notificações registradas.</li> : null}
        </ul>
      </section>
    </div>
  );
}