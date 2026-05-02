type RiskScoreCardProps = {
  score: number;
  riskLevel: string;
  recommendation: string;
  reasons?: string[];
  notes?: string | null;
};

export function RiskScoreCard({
  score,
  riskLevel,
  recommendation,
  reasons = [],
  notes,
}: RiskScoreCardProps) {
  return (
    <article className="credpagos-status-card">
      <h3 className="credpagos-credito-card-title">Análise automática</h3>
      <div className="credpagos-key-value">
        <span>Score interno</span>
        <strong>{score}</strong>
      </div>
      <div className="credpagos-key-value">
        <span>Risco</span>
        <strong>{riskLevel}</strong>
      </div>
      <div className="credpagos-key-value">
        <span>Recomendação</span>
        <strong>{recommendation}</strong>
      </div>
      {reasons.length ? (
        <ul>
          {reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}
      {notes ? <p>{notes}</p> : null}
    </article>
  );
}
