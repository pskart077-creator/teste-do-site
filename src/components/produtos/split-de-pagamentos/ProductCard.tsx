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
    title: "Reforco para capital de trabalho",
    description:
      "Credito para empresas manterem operacao, fornecedores e equipe em equilibrio.",
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
    title: "Condicoes conforme avaliacao",
    description:
      "Propostas apresentadas com clareza, alinhadas ao perfil e ao momento da empresa.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Wallet,
  },
  {
    title: "Processo com menos burocracia",
    description:
      "Jornada simples para solicitar credito com acompanhamento proximo do time.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Shuffle,
  },
  {
    title: "Analise responsavel",
    description:
      "Avaliacao objetiva para identificar alternativas de emprestimo adequadas.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Scale,
  },
  {
    title: "Transparencia total",
    description:
      "Valor, prazo e taxa explicados com clareza para decisao segura da empresa.",
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
