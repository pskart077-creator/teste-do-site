import {
  RefreshCcw,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  ShieldCheck,
  BarChart3,
} from "lucide-react";
import ServiceCard from "@/components/service-card-s-link/ServiceCard";

const productsData = [
  {
    title: "Fluxo de caixa com folego",
    description:
      "Capital de giro para cobrir despesas fixas e manter a rotina operacional.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: RefreshCcw,
  },
  {
    title: "Previsibilidade financeira",
    description:
      "Mais estabilidade para planejar despesas e organizar compromissos da empresa.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: CalendarDays,
  },
  {
    title: "Apoio para fornecedores",
    description:
      "Recurso para negociar melhor com fornecedores e manter o negocio em movimento.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: CircleDollarSign,
  },
  {
    title: "Agilidade no dia a dia",
    description:
      "Processo simplificado para acessar credito sem travar a operacao.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Clock3,
  },
  {
    title: "Analise responsavel",
    description:
      "Avaliacao de perfil para apresentar condicoes adequadas ao momento da empresa.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: ShieldCheck,
  },
  {
    title: "Condicoes com clareza",
    description:
      "Transparencia em valor, prazo e taxa para apoiar uma decisao segura.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: BarChart3,
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
