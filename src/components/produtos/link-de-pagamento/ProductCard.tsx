import {
  Link2,
  Send,
  Smartphone,
  Wallet,
  Clock3,
  CircleDollarSign,
} from "lucide-react";
import ServiceCard from "@/components/service-card-s-link/ServiceCard";

const productsData = [
  {
    title: "Organizacao de contas",
    description:
      "Emprestimo pessoal para reequilibrar despesas e reduzir pressao no mes a mes.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Link2,
  },
  {
    title: "Cobertura de imprevistos",
    description:
      "Apoio financeiro para despesas urgentes com atendimento humanizado.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Send,
  },
  {
    title: "Planejamento de objetivos",
    description:
      "Use o credito para realizar planos com condicoes avaliadas conforme perfil.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Smartphone,
  },
  {
    title: "Processo simplificado",
    description:
      "Solicitacao com menos burocracia e orientacao clara sobre cada etapa.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Wallet,
  },
  {
    title: "Analise agil",
    description:
      "Avaliacao responsavel para apresentar possibilidades de forma objetiva.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Clock3,
  },
  {
    title: "Transparencia nas condicoes",
    description:
      "Valores, prazos e taxas informados com clareza para decisao mais segura.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: CircleDollarSign,
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
