import Link from "next/link";
import { requireInternalPageSession } from "@/lib/admin-interno/auth";
import { INTERNAL_PRIORITY_LABEL, INTERNAL_STATUS_LABEL } from "@/lib/admin-interno/constants";
import { getLeadEmailDisplay } from "@/lib/admin-interno/lead-email";
import { listLeads } from "@/lib/admin-interno/leads";
import { prisma } from "@/lib/db/prisma";
import { InternalLeadStatus } from "@prisma/client";

const LEAD_STATUS_OPTIONS: InternalLeadStatus[] = [
  InternalLeadStatus.NOVO,
  InternalLeadStatus.EM_ANALISE,
  InternalLeadStatus.CONTATADO,
  InternalLeadStatus.QUALIFICADO,
  InternalLeadStatus.CONVERTIDO,
  InternalLeadStatus.PERDIDO,
  InternalLeadStatus.SPAM,
];

export default async function InternalLeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireInternalPageSession("leads:read");

  const params = await searchParams;

  const query = {
    page: Number(params.page ?? "1") || 1,
    pageSize: 20,
    status:
      typeof params.status === "string" && LEAD_STATUS_OPTIONS.includes(params.status as InternalLeadStatus)
        ? (params.status as InternalLeadStatus)
        : undefined,
    source: typeof params.source === "string" ? params.source : undefined,
    assigneeId: typeof params.assigneeId === "string" ? params.assigneeId : undefined,
    from: typeof params.from === "string" ? params.from : undefined,
    to: typeof params.to === "string" ? params.to : undefined,
    q: typeof params.q === "string" ? params.q : undefined,
  };

  const [result, assignees] = await Promise.all([
    listLeads(query),
    prisma.internalAdminUser.findMany({
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
    }),
  ]);

  return (
    <div className="admin-page-stack">
      <section className="admin-card">
        <h2>Filtros de leads</h2>
        <form className="admin-filter-grid" method="GET" action="/admin-interno/leads">
          <label>
            Busca
            <input
              type="search"
              name="q"
              placeholder="Nome, e-mail, telefone ou empresa"
              defaultValue={query.q}
            />
          </label>

          <label>
            Status
            <select name="status" defaultValue={query.status ?? ""}>
              <option value="">Todos</option>
              {LEAD_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {INTERNAL_STATUS_LABEL[status]}
                </option>
              ))}
            </select>
          </label>

          <label>
            Origem
            <input name="source" defaultValue={query.source} placeholder="origem" />
          </label>

          <label>
            Responsável
            <select name="assigneeId" defaultValue={query.assigneeId ?? ""}>
              <option value="">Todos</option>
              {assignees.map((assignee) => (
                <option key={assignee.id} value={assignee.id}>
                  {assignee.fullName}
                </option>
              ))}
            </select>
          </label>

          <label>
            De
            <input type="date" name="from" defaultValue={query.from} />
          </label>

          <label>
            Até
            <input type="date" name="to" defaultValue={query.to} />
          </label>

          <button type="submit" className="admin-primary-button">
            Aplicar filtros
          </button>
        </form>
      </section>

      <section className="admin-card">
        <div className="admin-card-header">
          <h2>Leads ({result.total})</h2>
          <div className="admin-card-header-actions">
            <Link className="admin-ghost-button" href="/admin-interno/kanban">
              Abrir Kanban
            </Link>
            <a className="admin-ghost-button" href={`/admin-interno/api/leads/export?${new URLSearchParams({
              ...(query.status ? { status: query.status } : {}),
              ...(query.source ? { source: query.source } : {}),
              ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
              ...(query.from ? { from: query.from } : {}),
              ...(query.to ? { to: query.to } : {}),
              ...(query.q ? { q: query.q } : {}),
            }).toString()}`}>
              Exportar CSV
            </a>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table admin-leads-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Status</th>
                <th>Prioridade</th>
                <th>Origem</th>
                <th>Responsável</th>
                <th>Criado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {result.leads.map((lead) => (
                <tr key={lead.id}>
                  <td>{lead.name}</td>
                  <td>{getLeadEmailDisplay(lead.email)}</td>
                  <td>{INTERNAL_STATUS_LABEL[lead.status]}</td>
                  <td>{INTERNAL_PRIORITY_LABEL[lead.priority]}</td>
                  <td>{lead.source ?? "-"}</td>
                  <td>{lead.assignee?.fullName ?? "Não atribuído"}</td>
                  <td>{lead.createdAt.toLocaleString("pt-BR")}</td>
                  <td>
                    <Link className="admin-inline-link" href={`/admin-interno/leads/${lead.id}`}>
                      Ver detalhes
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-pagination">
          <span>
            Página {result.page} de {result.totalPages}
          </span>
          <div>
            {result.page > 1 ? (
              <Link
                className="admin-ghost-button"
                href={`/admin-interno/leads?${new URLSearchParams({
                  ...Object.fromEntries(
                    Object.entries({
                      status: query.status,
                      source: query.source,
                      assigneeId: query.assigneeId,
                      from: query.from,
                      to: query.to,
                      q: query.q,
                    }).filter(([, value]) => Boolean(value)),
                  ),
                  page: String(result.page - 1),
                }).toString()}`}
              >
                Anterior
              </Link>
            ) : null}
            {result.page < result.totalPages ? (
              <Link
                className="admin-ghost-button"
                href={`/admin-interno/leads?${new URLSearchParams({
                  ...Object.fromEntries(
                    Object.entries({
                      status: query.status,
                      source: query.source,
                      assigneeId: query.assigneeId,
                      from: query.from,
                      to: query.to,
                      q: query.q,
                    }).filter(([, value]) => Boolean(value)),
                  ),
                  page: String(result.page + 1),
                }).toString()}`}
              >
                Próxima
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}