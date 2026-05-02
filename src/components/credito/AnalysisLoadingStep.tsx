const analysisItems = [
  "Conferindo a renda declarada",
  "Calculando o limite da parcela",
  "Buscando possibilidades de crédito",
  "Preparando a proposta disponível",
];

export function AnalysisLoadingStep() {
  return (
    <article className="credpagos-analysis-loading-card" aria-live="polite">
      <div className="credpagos-analysis-loader" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="credpagos-analysis-loading-copy">
        <span className="credpagos-credito-eyebrow">Análise em andamento</span>
        <h2>Analisando possibilidades de crédito</h2>
        <p>
          Estamos verificando os dados informados para encontrar uma opção
          compatível com seu perfil.
        </p>
      </div>

      <div className="credpagos-analysis-loading-list">
        {analysisItems.map((item) => (
          <div key={item} className="credpagos-analysis-loading-item">
            <span aria-hidden="true" />
            <strong>{item}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}