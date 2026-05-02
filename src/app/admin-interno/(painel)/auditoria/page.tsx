import { requireInternalPageSession } from "@/lib/admin-interno/auth";
import { prisma } from "@/lib/db/prisma";

export default async function InternalAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireInternalPageSession("audit:read");
  const params = await searchParams;

  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const pageSize = 30;
  const action = typeof params.action === "string" ? params.action : undefined;
  const entityType = typeof params.entityType === "string" ? params.entityType : undefined;
  const from = typeof params.from === "string" ? new Date(params.from) : null;
  const to = typeof params.to === "string" ? new Date(params.to) : null;

  const where = {
    ...(action ? { action: action as never } : {}),
    ...(entityType ? { entityType } : {}),
    ...((from || to)
      ? {
          createdAt: {
            ...(from && !Number.isNaN(from.getTime()) ? { gte: from } : {}),
            ...(to && !Number.isNaN(to.getTime()) ? { lte: to } : {}),
          },
        }
      : {}),
  };

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="admin-page-stack">
      <section className="admin-card">
        <h2>Filtros de auditoria</h2>
        <form className="admin-filter-grid" method="GET" action="/admin-interno/auditoria">
          <label>
            Ação
            <input name="action" defaultValue={action} placeholder="LEAD_STATUS_CHANGED" />
          </label>

          <label>
            Entidade
            <input name="entityType" defaultValue={entityType} placeholder="lead" />
          </label>

          <label>
            De
            <input type="date" name="from" defaultValue={typeof params.from === "string" ? params.from : ""} />
          </label>

          <label>
            Até
            <input type="date" name="to" defaultValue={typeof params.to === "string" ? params.to : ""} />
          </label>

          <button type="submit" className="admin-primary-button">
            Filtrar
          </button>
        </form>
      </section>

      <section className="admin-card">
        <h2>Logs de auditoria ({total})</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Usuário</th>
                <th>Ação</th>
                <th>Entidade</th>
                <th>Contexto</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.createdAt.toLocaleString("pt-BR")}</td>
                  <td>{log.actor?.fullName ?? "Sistema"}</td>
                  <td>{log.action}</td>
                  <td>
                    {log.entityType}
                    {log.entityId ? ` (${log.entityId})` : ""}
                  </td>
                  <td>{log.context ? JSON.stringify(log.context) : "-"}</td>
                  <td>{log.ipMasked ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-pagination">
          <span>
            Página {page} de {totalPages}
          </span>
          <div>
            {page > 1 ? (
              <a
                className="admin-ghost-button"
                href={`/admin-interno/auditoria?${new URLSearchParams({
                  ...(action ? { action } : {}),
                  ...(entityType ? { entityType } : {}),
                  ...(typeof params.from === "string" ? { from: params.from } : {}),
                  ...(typeof params.to === "string" ? { to: params.to } : {}),
                  page: String(page - 1),
                }).toString()}`}
              >
                Anterior
              </a>
            ) : null}
            {page < totalPages ? (
              <a
                className="admin-ghost-button"
                href={`/admin-interno/auditoria?${new URLSearchParams({
                  ...(action ? { action } : {}),
                  ...(entityType ? { entityType } : {}),
                  ...(typeof params.from === "string" ? { from: params.from } : {}),
                  ...(typeof params.to === "string" ? { to: params.to } : {}),
                  page: String(page + 1),
                }).toString()}`}
              >
                Próxima
              </a>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}