import {
  Blocks,
  Wallet,
  FileCode2,
  ShieldCheck,
  Activity,
  BadgeCheck,
} from "lucide-react";
import ServiceCard from "@/components/service-card/ServiceCard";

const solutionsData = [
  {
    title: "Diagnóstico do perfil",
    description:
      "Avaliamos sua necessidade, renda, objetivo e valor desejado para orientar a melhor alternativa de crédito.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Blocks,
  },
  {
    title: "Orientação personalizada",
    description:
      "Atendimento próximo para explicar condições, prazos e etapas antes da contratação.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Wallet,
  },
  {
    title: "Mais clareza na escolha",
    description:
      "Apresentamos as opções disponíveis para você tomar uma decisão com mais segurança e tranquilidade.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: FileCode2,
  },
  {
    title: "Processo seguro",
    description:
      "A jornada segue critérios de análise responsável e boas práticas de transparência.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: ShieldCheck,
  },
  {
    title: "Acompanhamento próximo",
    description:
      "Do primeiro contato até a proposta, você conta com suporte para entender cada etapa do processo.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Activity,
  },
  {
    title: "Crédito com orientação",
    description:
      "Nosso foco é simplificar o acesso ao empréstimo para pessoa física, com menos burocracia e mais confiança.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: BadgeCheck,
  },
];

export default function Solutions() {
  return (
    <section className="solutions-grid-section">
      <div className="solutions-grid-container">
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