import {
  MousePointerClick,
  ShoppingCart,
  ArrowLeftRight,
  Smile,
  Zap,
  BadgeDollarSign,
} from "lucide-react";
import ServiceCard from "@/components/service-card-s-link/ServiceCard";

const productsData = [
  {
    title: "Reforco de caixa empresarial",
    description:
      "Credito para manter compromissos operacionais e preservar a saude financeira da empresa.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: ShoppingCart,
  },
  {
    title: "Capital para oportunidades",
    description:
      "Apoio para expansao, investimentos e melhorias estrategicas no negocio.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: MousePointerClick,
  },
  {
    title: "Condicoes conforme perfil",
    description:
      "Propostas com valores, prazos e taxas definidos de acordo com analise de credito.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: ArrowLeftRight,
  },
  {
    title: "Atendimento proximo",
    description:
      "Orientacao comercial para apoiar cada etapa da solicitacao e contratacao.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Smile,
  },
  {
    title: "Analise agil e responsavel",
    description:
      "Processo simples para identificar possibilidades de credito com menos burocracia.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Zap,
  },
  {
    title: "Decisao com seguranca",
    description:
      "Clareza sobre condicoes para escolher a solucao mais adequada ao momento da empresa.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: BadgeDollarSign,
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
