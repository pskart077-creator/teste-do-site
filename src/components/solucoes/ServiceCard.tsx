import {
  BadgeDollarSign,
  Building2,
  FileCheck2,
  Headset,
  Landmark,
  UserRound,
} from "lucide-react";
import ServiceCard from "@/components/service-card/ServiceCard";

const solutionsData = [
  {
    title: "Crédito para MEI",
    description:
      "Empréstimo para microempreendedores que precisam investir no negócio, comprar estoque, pagar fornecedores ou organizar o caixa.",
    href: "/solucoes/credito-para-mei",
    linkLabel: "Saiba Mais",
    icon: BadgeDollarSign,
  },
  {
    title: "Crédito para PJ",
    description:
      "Capital para empresas que precisam reforçar o fluxo de caixa, manter a operação, expandir ou aproveitar novas oportunidades.",
    href: "/solucoes/credito-para-pj",
    linkLabel: "Saiba Mais",
    icon: Building2,
  },
  {
    title: "Crédito para PF",
    description:
      "Empréstimo pessoal para quem precisa quitar contas, resolver imprevistos, organizar a vida financeira ou realizar planos.",
    href: "/solucoes/credito-para-pf",
    linkLabel: "Saiba Mais",
    icon: UserRound,
  },
  {
    title: "Capital de Giro",
    description:
      "Solução de crédito para empresas que precisam manter o negócio em movimento com mais segurança e previsibilidade.",
    href: "/solucoes/capital-de-giro",
    linkLabel: "Saiba Mais",
    icon: Landmark,
  },
  {
    title: "Análise de Crédito",
    description:
      "Processo simples e transparente para avaliar o perfil do solicitante e encontrar uma proposta adequada ao momento financeiro.",
    href: "/solucoes/analise-de-credito",
    linkLabel: "Saiba Mais",
    icon: FileCheck2,
  },
  {
    title: "Consultoria de Crédito",
    description:
      "Atendimento próximo para entender a necessidade do cliente e orientar na escolha da melhor solução de empréstimo.",
    href: "/solucoes/consultoria-de-credito",
    linkLabel: "Saiba Mais",
    icon: Headset,
  },
];

export default function Solutions() {
  return (
    <section className="solutions-grid-section">
      <div className="solutions-grid-container">
        <div className="solutions-grid-intro">
          <span className="solutions-grid-eyebrow">Soluções</span>
          <h2 className="solutions-grid-title">
            Crédito para MEI, PJ e PF com atendimento próximo
          </h2>
          <p className="solutions-grid-description">
            A Credpagos oferece soluções de crédito com análise responsável,
            menos burocracia e condições transparentes.
          </p>
        </div>

        <div className="solutions-grid">
          {solutionsData.map((item, index) => (
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
