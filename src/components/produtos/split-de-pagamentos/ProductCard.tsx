import {
  Split,
  GitBranch,
  Wallet,
  Shuffle,
  Scale,
  BadgePercent,
} from "lucide-react";
import ServiceCard from "@/components/service-card-s-link/ServiceCard";

const productsData = [
  {
    title: "Reforço para capital de trabalho",
    description:
      "Crédito para empresas manterem operação, fornecedores e equipe em equilíbrio.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Split,
  },
  {
    title: "Apoio para expansao",
    description:
      "Mais folego financeiro para crescer com planejamento e continuidade operacional.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: GitBranch,
  },
  {
    title: "Condições conforme avaliação",
    description:
      "Propostas apresentadas com clareza, alinhadas ao perfil e ao momento da empresa.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Wallet,
  },
  {
    title: "Processo com menos burocracia",
    description:
      "Jornada simples para solicitar crédito com acompanhamento próximo do time.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Shuffle,
  },
  {
    title: "Análise responsável",
    description:
      "Avaliação objetiva para identificar alternativas de empréstimo adequadas.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Scale,
  },
  {
    title: "Transparência total",
    description:
      "Valor, prazo e taxa explicados com clareza para decisão segura da empresa.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: BadgePercent,
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
