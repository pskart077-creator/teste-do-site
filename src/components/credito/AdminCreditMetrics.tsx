import { formatCurrencyBrl } from "@/lib/credit/helpers";

type AdminCreditMetricsProps = {
  total: number;
  inAnalysis: number;
  preApproved: number;
  released: number;
  requestedVolume: number;
  estimatedVolume: number;
};

export function AdminCreditMetrics({
  total,
  inAnalysis,
  preApproved,
  released,
  requestedVolume,
  estimatedVolume,
}: AdminCreditMetricsProps) {
  const metrics = [
    { label: "Total de solicitações", value: String(total) },
    { label: "Em análise", value: String(inAnalysis) },
    { label: "Pré-aprovadas", value: String(preApproved) },
    { label: "Créditos liberados", value: String(released) },
    { label: "Volume solicitado", value: formatCurrencyBrl(requestedVolume) },
    {
      label: "Volume líquido estimado",
      value: formatCurrencyBrl(estimatedVolume),
    },
  ];

  return (
    <div className="credpagos-admin-metrics">
      {metrics.map((metric) => (
        <article className="credpagos-admin-metric" key={metric.label}>
          <div className="credpagos-admin-metric-label">{metric.label}</div>
          <div className="credpagos-admin-metric-value">{metric.value}</div>
        </article>
      ))}
    </div>
  );
}