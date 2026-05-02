import type { Service } from "@/types";

export const SERVICES: Service[] = [
  {
    slug: "credito-para-mei",
    title: "Crédito para MEI",
    shortDescription:
      "Empréstimo para microempreendedores que precisam investir no negócio, comprar estoque, pagar fornecedores ou organizar o caixa.",
    seoDescription:
      "Conheça o crédito para MEI da Credpagos com atendimento próximo e análise responsável.",
    seoKeywords: [
      "crédito para mei",
      "empréstimo para mei",
      "capital para mei",
      "credpagos",
    ],
    description:
      "A Credpagos oferece crédito para MEI com uma jornada simples e transparente. A aprovação é sujeita à análise de crédito e as condições variam conforme o perfil.",
    highlights: [
      "Atendimento humanizado",
      "Análise responsável",
      "Condições conforme avaliação",
    ],
  },
  {
    slug: "credito-para-pj",
    title: "Crédito para PJ",
    shortDescription:
      "Capital para empresas que precisam reforçar o fluxo de caixa, manter a operação, expandir ou aproveitar novas oportunidades.",
    seoDescription:
      "Conheça o crédito para PJ da Credpagos com segurança, transparência e menos burocracia.",
    seoKeywords: [
      "crédito para pj",
      "empréstimo empresarial",
      "capital para empresas",
      "credpagos",
    ],
    description:
      "O crédito para PJ da Credpagos apoia empresas em diferentes fases. A aprovação ocorre mediante avaliação e os valores, prazos e taxas dependem da análise de crédito.",
    highlights: [
      "Apoio para fluxo de caixa",
      "Soluções para expansão",
      "Processo com menos burocracia",
    ],
  },
  {
    slug: "credito-para-pf",
    title: "Crédito para PF",
    shortDescription:
      "Empréstimo pessoal para quem precisa quitar contas, resolver imprevistos, organizar a vida financeira ou realizar planos.",
    seoDescription:
      "Descubra o crédito para PF da Credpagos com orientação e atendimento próximo.",
    seoKeywords: [
      "crédito para pf",
      "empréstimo pessoal",
      "crédito pessoal",
      "credpagos",
    ],
    description:
      "A Credpagos oferece crédito para PF com análise responsável e comunicação clara. As condições são apresentadas conforme perfil e avaliação de crédito.",
    highlights: [
      "Empréstimo pessoal com transparência",
      "Suporte durante a jornada",
      "Condições ajustadas ao perfil",
    ],
  },
  {
    slug: "capital-de-giro",
    title: "Capital de Giro",
    shortDescription:
      "Solução de crédito para empresas que precisam manter o negócio em movimento com mais segurança e previsibilidade.",
    seoDescription:
      "Veja como o capital de giro da Credpagos pode apoiar a operação da sua empresa.",
    seoKeywords: [
      "capital de giro",
      "crédito para empresas",
      "fluxo de caixa",
      "credpagos",
    ],
    description:
      "O capital de giro da Credpagos é indicado para empresas que precisam reforçar caixa e manter a operação. A aprovação depende da análise de crédito e do perfil.",
    highlights: [
      "Reforço para operação",
      "Mais previsibilidade financeira",
      "Análise de crédito responsável",
    ],
  },
  {
    slug: "analise-de-credito",
    title: "Análise de Crédito",
    shortDescription:
      "Processo simples e transparente para avaliar o perfil do solicitante e encontrar uma proposta adequada ao momento financeiro.",
    seoDescription:
      "Entenda a análise de crédito da Credpagos para MEI, PJ e PF.",
    seoKeywords: [
      "análise de crédito",
      "avaliação de crédito",
      "aprovação mediante avaliação",
      "credpagos",
    ],
    description:
      "A análise de crédito da Credpagos considera o perfil e os dados da solicitação para identificar possibilidades de proposta com responsabilidade.",
    highlights: [
      "Critérios claros de avaliação",
      "Transparência na comunicação",
      "Condições conforme perfil",
    ],
  },
  {
    slug: "consultoria-de-credito",
    title: "Consultoria de Crédito",
    shortDescription:
      "Atendimento próximo para entender a necessidade do cliente e orientar na escolha da melhor solução de empréstimo.",
    seoDescription:
      "Fale com a consultoria de crédito da Credpagos e receba orientação para MEI, PJ e PF.",
    seoKeywords: [
      "consultoria de crédito",
      "orientação financeira",
      "empréstimo com atendimento",
      "credpagos",
    ],
    description:
      "A consultoria de crédito da Credpagos orienta cada cliente com foco em clareza, segurança e aderência ao momento financeiro.",
    highlights: [
      "Atendimento consultivo",
      "Orientação para decisão segura",
      "Acompanhamento da solicitação",
    ],
  },
];

const SERVICE_SLUG_ALIASES: Record<string, string> = {
  "para-voce": "credito-para-pf",
  "para-empresa": "credito-para-pj",
  "para-sua-empresa": "credito-para-pj",
  "para-seu-negocio": "credito-para-pj",
};

export function getAllServiceSlugs() {
  return [...new Set([...SERVICES.map((service) => service.slug), ...Object.keys(SERVICE_SLUG_ALIASES)])];
}

export function getServiceBySlug(slug: string) {
  const resolvedSlug = SERVICE_SLUG_ALIASES[slug] ?? slug;
  return SERVICES.find((service) => service.slug === resolvedSlug);
}
