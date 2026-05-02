import type { SlugPageDetail } from "@/types";

export const ABOUT_TOPICS: SlugPageDetail[] = [
  {
    slug: "sobre-nos",
    title: "Sobre Nós",
    seoDescription:
      "Conheça a Credpagos e nossa forma de facilitar o acesso ao crédito para MEI, PJ e PF com clareza, segurança e atendimento próximo.",
    seoKeywords: ["sobre credpagos", "crédito", "empréstimo", "mei pj pf"],
    description:
      "A Credpagos nasceu para simplificar o acesso ao crédito. Atuamos conectando pessoas físicas, microempreendedores e empresas a soluções de empréstimo mais claras, seguras e alinhadas ao seu momento financeiro.",
    highlights: [
      "Atendimento próximo",
      "Análise responsável",
      "Jornada menos burocrática",
    ],
  },
  {
    slug: "missao",
    title: "Nossa Missão",
    seoDescription:
      "Conheça a missão da Credpagos para ampliar o acesso ao crédito com responsabilidade.",
    seoKeywords: ["missão credpagos", "crédito responsável", "atendimento humano"],
    description:
      "Nosso compromisso é oferecer atendimento próximo, análise responsável e uma jornada menos burocrática para quem precisa de dinheiro para organizar a vida, investir no negócio ou fortalecer a operação.",
    highlights: [
      "Apoio para MEI, PJ e PF",
      "Condições transparentes",
      "Segurança e clareza em cada etapa",
    ],
  },
  {
    slug: "visao",
    title: "Nossa Visão",
    seoDescription:
      "Veja a visão da Credpagos para tornar o acesso ao crédito mais simples, seguro e transparente.",
    seoKeywords: ["visão credpagos", "soluções de crédito", "empréstimos"],
    description:
      "Queremos ser referência em soluções de crédito com atendimento humano e comunicação responsável, sempre com condições adequadas ao perfil de cada cliente.",
    highlights: [
      "Mais confiança na contratação",
      "Mais transparência nas condições",
      "Mais eficiência no atendimento",
    ],
  },
];

export function getAboutTopicBySlug(slug: string) {
  return ABOUT_TOPICS.find((topic) => topic.slug === slug);
}
