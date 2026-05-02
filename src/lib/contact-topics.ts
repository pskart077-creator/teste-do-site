import type { SlugPageDetail } from "@/types";

export const CONTACT_TOPICS: SlugPageDetail[] = [
  {
    slug: "atendimento-comercial",
    title: "Atendimento comercial",
    seoDescription:
      "Fale com o time da Credpagos para simular crédito e entender as condições disponíveis para MEI, PJ e PF.",
    seoKeywords: ["contato credpagos", "simular crédito", "atendimento comercial"],
    description:
      "Converse com nosso time para entender a melhor alternativa de crédito para o seu momento financeiro.",
    highlights: [
      "Orientação para MEI, PJ e PF",
      "Clareza sobre condições",
      "Atendimento próximo",
    ],
  },
  {
    slug: "suporte",
    title: "Suporte",
    seoDescription:
      "Acesse o suporte da Credpagos para acompanhar solicitações e esclarecer dúvidas.",
    seoKeywords: ["suporte credpagos", "dúvidas de crédito", "atendimento"],
    description:
      "Nosso suporte ajuda você a acompanhar etapas, enviar informações e entender o status da análise de crédito.",
    highlights: [
      "Acompanhamento de solicitação",
      "Respostas objetivas",
      "Atendimento humanizado",
    ],
  },
  {
    slug: "parcerias",
    title: "Parcerias",
    seoDescription:
      "Entre em contato com a Credpagos para avaliar parcerias comerciais relacionadas a crédito.",
    seoKeywords: ["parcerias credpagos", "crédito para empresas", "parceria comercial"],
    description:
      "Construímos parcerias para ampliar o acesso a soluções de crédito com responsabilidade e relacionamento de longo prazo.",
    highlights: [
      "Modelos de parceria sob demanda",
      "Foco em crescimento sustentável",
      "Atendimento comercial dedicado",
    ],
  },
];

export function getContactTopicBySlug(slug: string) {
  return CONTACT_TOPICS.find((topic) => topic.slug === slug);
}
