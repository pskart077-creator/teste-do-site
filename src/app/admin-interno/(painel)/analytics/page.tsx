import { requireInternalPageSession } from "@/lib/admin-interno/auth";
import { getAnalyticsOverview } from "@/lib/admin-interno/analytics";

const RANGE_OPTIONS = [7, 30, 90, 180];

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function InternalAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireInternalPageSession("analytics:read");
  const params = await searchParams;

  const requestedRange =
    typeof params.days === "string" ? Number(params.days) : undefined;
  const days =
    requestedRange && RANGE_OPTIONS.includes(requestedRange)
      ? requestedRange
      : 30;

  const overview = await getAnalyticsOverview(days);

  return (
    <div className="admin-page-stack">
      <section className="admin-card">
        <div className="admin-card-header">
          <h2>Analytics de navegação</h2>
          <form method="GET" action="/admin-interno/analytics">
            <label>
              Período
              <select name="days" defaultValue={String(overview.rangeDays)}>
                {RANGE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    Últimos {option} dias
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="admin-ghost-button">
              Atualizar
            </button>
          </form>
        </div>
      </section>

      <section className="admin-metrics-grid" aria-label="Métricas de analytics">
        <article className="admin-metric-card">
          <p>Pageviews</p>
          <strong>{overview.metrics.pageViews}</strong>
        </article>
        <article className="admin-metric-card">
          <p>Visitantes ativos</p>
          <strong>{overview.metrics.activeVisitors}</strong>
        </article>
        <article className="admin-metric-card">
          <p>Sessões ativas</p>
          <strong>{overview.metrics.activeSessions}</strong>
        </article>
        <article className="admin-metric-card">
          <p>Conversões (leads)</p>
          <strong>{overview.metrics.leadSubmissions}</strong>
        </article>
        <article className="admin-metric-card">
          <p>Sessões com conversão</p>
          <strong>{overview.metrics.convertingSessions}</strong>
        </article>
        <article className="admin-metric-card">
          <p>Taxa de conversão</p>
          <strong>{overview.metrics.conversionRate}%</strong>
        </article>
      </section>

      <section className="admin-card admin-analytics-grid">
        <article>
          <h3>Top páginas</h3>
          <ul className="admin-analytics-list">
            {overview.topPages.map((item) => (
              <li key={item.path}>
                <span>{item.path}</span>
                <strong>{item.count}</strong>
              </li>
            ))}
            {!overview.topPages.length ? <li>Sem dados no período.</li> : null}
          </ul>
        </article>

        <article>
          <h3>Top origens</h3>
          <ul className="admin-analytics-list">
            {overview.topSources.map((item) => (
              <li key={item.source}>
                <span>{item.source}</span>
                <strong>{item.count}</strong>
              </li>
            ))}
            {!overview.topSources.length ? <li>Sem dados no período.</li> : null}
          </ul>
        </article>

        <article>
          <h3>Dispositivos</h3>
          <ul className="admin-analytics-list">
            {overview.devices.map((item) => (
              <li key={item.deviceType}>
                <span>{item.deviceType}</span>
                <strong>{item.count}</strong>
              </li>
            ))}
            {!overview.devices.length ? <li>Sem dados no período.</li> : null}
          </ul>
        </article>

        <article>
          <h3>Geografia</h3>
          <ul className="admin-analytics-list">
            {overview.countries.map((item) => (
              <li key={item.country}>
                <span>{item.country}</span>
                <strong>{item.count}</strong>
              </li>
            ))}
            {!overview.countries.length ? <li>Sem dados no período.</li> : null}
          </ul>
        </article>
      </section>

      <section className="admin-card">
        <h3>Eventos recentes</h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Página</th>
                <th>Origem</th>
                <th>País</th>
                <th>Dispositivo</th>
              </tr>
            </thead>
            <tbody>
              {overview.recentEvents.map((event) => (
                <tr key={event.id}>
                  <td>{event.occurredAt.toLocaleString("pt-BR")}</td>
                  <td>{event.eventType}</td>
                  <td>{event.path}</td>
                  <td>{event.source ?? "-"}</td>
                  <td>{event.country ?? "-"}</td>
                  <td>{event.deviceType ?? "-"}</td>
                </tr>
              ))}
              {!overview.recentEvents.length ? (
                <tr>
                  <td colSpan={6}>Nenhum evento encontrado no período.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}