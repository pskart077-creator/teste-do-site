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
    title: "Diagnóstico empresarial",
    description:
      "Avaliamos o perfil da empresa, objetivo do crédito, valor desejado e contexto financeiro para orientar a melhor proposta.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Blocks,
  },
  {
    title: "Orientação comercial",
    description:
      "Atendimento próximo para explicar condições, prazos e etapas antes da contratação do crédito para PJ.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Wallet,
  },
  {
    title: "Mais clareza na decisão",
    description:
      "Comparamos as alternativas disponíveis para sua empresa escolher com mais segurança e estratégia.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: FileCode2,
  },
  {
    title: "Processo seguro",
    description:
      "A jornada segue critérios de análise responsável e boas práticas de transparência para empresas.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: ShieldCheck,
  },
  {
    title: "Acompanhamento próximo",
    description:
      "Do primeiro contato até a proposta, sua empresa conta com suporte para entender cada etapa.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Activity,
  },
  {
    title: "Crédito com orientação",
    description:
      "Nosso foco é simplificar o acesso ao empréstimo para PJ, com menos burocracia e mais confiança.",
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