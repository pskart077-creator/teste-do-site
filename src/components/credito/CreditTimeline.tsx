import type { CreditApplicationStatus } from "@prisma/client";
import { CREDIT_TIMELINE_ORDER } from "@/lib/credit/constants";
import { statusLabel } from "@/lib/credit/helpers";

type CreditTimelineProps = {
  currentStatus: CreditApplicationStatus;
  history?: Array<{
    id: string;
    toStatus: CreditApplicationStatus;
    note: string | null;
    createdAt: string | Date;
  }>;
};

export function CreditTimeline({ currentStatus, history = [] }: CreditTimelineProps) {
  const currentIndex = CREDIT_TIMELINE_ORDER.findIndex((item) => item === currentStatus);

  return (
    <div className="credpagos-status-card">
      <h3 className="credpagos-credito-card-title">Linha do tempo</h3>
      <div className="credpagos-status-timeline">
        {CREDIT_TIMELINE_ORDER.map((status, index) => (
          <div className="credpagos-status-timeline-item" key={status}>
            <span
              className={`credpagos-status-timeline-dot${index <= currentIndex ? " is-active" : ""}`}
            />
            <div>
              <strong>{statusLabel(status)}</strong>
            </div>
          </div>
        ))}
      </div>

      {history.length ? (
        <details>
          <summary>Histórico detalhado</summary>
          <ul>
            {history.map((entry) => (
              <li key={entry.id}>
                {statusLabel(entry.toStatus)} - {new Date(entry.createdAt).toLocaleString("pt-BR")}
                {entry.note ? ` - ${entry.note}` : ""}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
