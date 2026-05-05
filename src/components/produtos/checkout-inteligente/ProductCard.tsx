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
    title: "Reforço de caixa empresarial",
    description:
      "Crédito para manter compromissos operacionais e preservar a saúde financeira da empresa.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: ShoppingCart,
  },
  {
    title: "Capital para oportunidades",
    description:
      "Apoio para expansão, investimentos e melhorias estratégicas no negócio.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: MousePointerClick,
  },
  {
    title: "Condições conforme perfil",
    description:
      "Propostas com valores, prazos e taxas definidos de acordo com análise de crédito.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: ArrowLeftRight,
  },
  {
    title: "Atendimento próximo",
    description:
      "Orientação comercial para apoiar cada etapa da solicitação e contratação.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Smile,
  },
  {
    title: "Análise ágil e responsável",
    description:
      "Processo simples para identificar possibilidades de crédito com menos burocracia.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Zap,
  },
  {
    title: "Decisão com segurança",
    description:
      "Clareza sobre condições para escolher a solução mais adequada ao momento da empresa.",
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
