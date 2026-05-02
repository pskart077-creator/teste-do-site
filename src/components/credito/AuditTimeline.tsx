type AuditTimelineItem = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  ip: string | null;
  createdAt: string | Date;
};

type AuditTimelineProps = {
  items: AuditTimelineItem[];
};

export function AuditTimeline({ items }: AuditTimelineProps) {
  if (!items.length) {
    return (
      <div className="credpagos-empty">
        Nenhum registro de auditoria encontrado.
      </div>
    );
  }

  return (
    <div className="credpagos-status-card">
      <h3 className="credpagos-credito-card-title">Auditoria</h3>

      <div className="credpagos-status-timeline">
        {items.map((item) => (
          <div className="credpagos-status-timeline-item" key={item.id}>
            <span className="credpagos-status-timeline-dot is-active" />

            <div>
              <strong>{item.action}</strong>

              <div>
                {item.entity} {item.entityId ? `#${item.entityId}` : ""} -{" "}
                {new Date(item.createdAt).toLocaleString("pt-BR")}
              </div>

              {item.ip ? <small>IP: {item.ip}</small> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}