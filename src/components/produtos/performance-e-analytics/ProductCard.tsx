import {
  BarChart3,
  LineChart,
  Activity,
  Gauge,
  TrendingUp,
  SearchCheck,
} from "lucide-react";
import ServiceCard from "@/components/service-card-s-link/ServiceCard";

const productsData = [
  {
    title: "Mais visibilidade de resultados",
    description:
      "Acompanhe indicadores importantes com mais clareza para entender melhor a performance da operação.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: BarChart3,
  },
  {
    title: "Leitura mais estratégica dos dados",
    description:
      "Transforme informações operacionais em análises mais úteis para orientar decisões com mais confiança.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: LineChart,
  },
  {
    title: "Monitoramento contínuo da operação",
    description:
      "Observe o comportamento da operação em tempo real e identifique movimentos importantes com mais rapidez.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Activity,
  },
  {
    title: "Mais controle de performance",
    description:
      "Avalie melhor a eficiência dos fluxos e acompanhe o desempenho com mais organização e precisão.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Gauge,
  },
  {
    title: "Identificação de oportunidades",
    description:
      "Encontre pontos de melhoria e novas possibilidades de crescimento a partir de uma leitura mais clara dos dados.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: TrendingUp,
  },
  {
    title: "Decisões mais bem orientadas",
    description:
      "Use dados e indicadores para tomar decisões com mais base, segurança e visão estratégica.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: SearchCheck,
  },
];

export default function Products() {
  return (
    <section className="solutions-grid-section">
      <div className="solutions-grid-container">
        <div className="solutions-grid">
          {productsData.map((item, index) => (
            <ServiceCard
              key={`${item.title}-${index}`}
              number={String(index + 1).padStart(2, "0")}
              title={item.title}
              description={item.description}
              href={item.href}
              linkLabel={item.linkLabel}
              icon={item.icon}
            />
          ))}
        </div>
      </div>
    </section>
  );
}