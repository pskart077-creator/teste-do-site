import {
  ShieldCheck,
  Gauge,
  Network,
  BarChart3,
  RefreshCw,
  Layers3,
} from "lucide-react";
import ServiceCard from "@/components/service-card-s-link/ServiceCard";

const productsData = [
  {
    title: "Investimento no negocio",
    description:
      "Credito para MEI investir em estrutura, estoque e melhoria da operacao.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: ShieldCheck,
  },
  {
    title: "Organizacao do caixa",
    description:
      "Mais folego para equilibrar despesas e manter continuidade da atividade.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Gauge,
  },
  {
    title: "Compromissos com fornecedores",
    description:
      "Apoio para cumprir compromissos financeiros e preservar ritmo de trabalho.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Network,
  },
  {
    title: "Planejamento com previsibilidade",
    description:
      "Condicoes transparentes para organizar o uso do credito com mais seguranca.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: BarChart3,
  },
  {
    title: "Analise responsavel",
    description:
      "Avaliacao de perfil para indicar alternativas adequadas ao momento financeiro.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: RefreshCw,
  },
  {
    title: "Menos burocracia",
    description:
      "Processo simples com atendimento proximo para facilitar cada etapa da jornada.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Layers3,
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
