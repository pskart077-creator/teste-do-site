import type { Metadata } from "next";
import type { Service, SlugPageDetail } from "@/types";

export const SITE_NAME = "Credpagos";
export const SITE_URL = "https://www.credpagos.com.br";
export const SOCIAL_SHARE_IMAGE_PATH = "/assets/img/social/social.png";
export const SOCIAL_SHARE_IMAGE_URL = new URL(
  SOCIAL_SHARE_IMAGE_PATH,
  SITE_URL,
).toString();

const COMMON_KEYWORDS = [
  "credpagos",
  "crédito",
  "empréstimo",
  "mei",
  "pj",
  "pf",
];

type PageSeo = {
  title: string;
  description: string;
  path: string;
  keywords: string[];
};

export type StaticPageSlug =
  | "sobre"
  | "contato"
  | "duvidasFrequentes"
  | "soluções"
  | "segmentos"
  | "news"
  | "segurança"
  | "pf"
  | "pj"
  | "solucoesParaVoce"
  | "solucoesParaEmpresas"
  | "solucoesParaIgaming"
  | "solucoesParaEcommerce"
  | "solucoesParaPF"
  | "solucoesParaPlataformasDigitais"
  | "solucoesParaNegociosRecorrentes"
  | "termsOfServices"
  | "privacyPolicy"
  | "cookiePolicy";

export const HOME_SEO: PageSeo = {
  title: "Crédito rápido para MEI, PJ e PF com análise simples",
  description:
    "A Credpagos facilita o acesso ao empréstimo para pessoas físicas, microempreendedores e empresas com segurança e transparência.",
  path: "/",
  keywords: [
    ...COMMON_KEYWORDS,
    "crédito para mei",
    "crédito para pj",
    "crédito para pf",
    "capital de giro",
    "consultoria de crédito",
  ],
};

export const STATIC_PAGE_SEO: Record<StaticPageSlug, PageSeo> = {
  sobre: {
    title: "Sobre a Credpagos",
    description:
      "Conheça a Credpagos e nossa forma de facilitar o acesso ao crédito para MEI, PJ e PF com clareza, segurança e atendimento próximo.",
    path: "/sobre",
    keywords: [...COMMON_KEYWORDS, "sobre credpagos", "crédito responsável"],
  },

  contato: {
    title: "Contato",
    description:
      "Fale com o time da Credpagos para simular crédito e entender as condições disponíveis para o seu perfil.",
    path: "/contato",
    keywords: [...COMMON_KEYWORDS, "simular crédito", "contato credpagos"],
  },

  duvidasFrequentes: {
    title: "Dúvidas Frequentes",
    description:
      "Tire suas dúvidas sobre empréstimos e soluções de crédito da Credpagos para MEI, PJ e PF.",
    path: "/duvidas-frequentes",
    keywords: [
      ...COMMON_KEYWORDS,
      "dúvidas frequentes",
      "faq credpagos",
      "empréstimo para mei pj pf",
    ],
  },

  soluções: {
    title: "Soluções de Crédito",
    description:
      "Explore as soluções da Credpagos para MEI, PJ e PF com análise de crédito, transparência e atendimento humanizado.",
    path: "/solucoes",
    keywords: [
      ...COMMON_KEYWORDS,
      "soluções de crédito",
      "empréstimo pessoal",
      "capital de giro",
    ],
  },

  segmentos: {
    title: "Segmentos",
    description:
      "Conheça como a Credpagos atende pessoas físicas, microempreendedores e empresas com soluções de crédito.",
    path: "/segmentos",
    keywords: [...COMMON_KEYWORDS, "segmentos de crédito", "mei pj pf"],
  },

  news: {
    title: "News",
    description:
      "Acompanhe conteúdos da Credpagos sobre crédito, educação financeira e tendências do mercado.",
    path: "/news",
    keywords: [...COMMON_KEYWORDS, "news credpagos", "conteúdo sobre crédito"],
  },

  segurança: {
    title: "Segurança",
    description:
      "Conheça como a Credpagos estrutura processos para oferecer segurança, confiança e transparência no atendimento.",
    path: "/seguranca",
    keywords: [...COMMON_KEYWORDS, "segurança", "análise responsável"],
  },

  pf: {
    title: "Crédito para PF",
    description:
      "Conheça as soluções da Credpagos para pessoa física e encontre alternativas de empréstimo conforme seu perfil.",
    path: "/pf",
    keywords: [...COMMON_KEYWORDS, "crédito para pf", "empréstimo pessoal"],
  },

  pj: {
    title: "Crédito para PJ",
    description:
      "Explore as soluções da Credpagos para empresas com foco em capital de giro, análise responsável e transparência.",
    path: "/pj",
    keywords: [...COMMON_KEYWORDS, "crédito para pj", "capital para empresas"],
  },

  solucoesParaVoce: {
    title: "Crédito para PF",
    description:
      "Soluções de empréstimo para pessoa física com análise de crédito e condições conforme avaliação.",
    path: "/solucoes/para-voce",
    keywords: [...COMMON_KEYWORDS, "crédito para pf", "empréstimo pessoal"],
  },

  solucoesParaEmpresas: {
    title: "Crédito para PJ",
    description:
      "Soluções de crédito para empresas com foco em fluxo de caixa, capital de giro e expansão sustentável.",
    path: "/solucoes/para-empresa",
    keywords: [...COMMON_KEYWORDS, "crédito para pj", "capital de giro"],
  },

  solucoesParaIgaming: {
    title: "Crédito para MEI",
    description:
      "Alternativas de crédito para microempreendedores com análise responsável e orientação comercial.",
    path: "/solucoes/para-igaming",
    keywords: [...COMMON_KEYWORDS, "crédito para mei", "empréstimo para mei"],
  },

  solucoesParaEcommerce: {
    title: "Empréstimo Pessoal",
    description:
      "Conheça alternativas de empréstimo pessoal para organizar contas, resolver imprevistos e realizar planos.",
    path: "/solucoes/para-e-commerce",
    keywords: [...COMMON_KEYWORDS, "empréstimo pessoal", "crédito para pf"],
  },

  solucoesParaPF: {
    title: "Análise de Crédito",
    description:
      "Entenda o processo de análise da Credpagos para avaliar perfil e indicar propostas adequadas.",
    path: "/solucoes/para-marketplaces",
    keywords: [...COMMON_KEYWORDS, "análise de crédito", "avaliação de perfil"],
  },

  solucoesParaPlataformasDigitais: {
    title: "Capital de Giro",
    description:
      "Soluções para reforçar fluxo de caixa e manter a operação com mais segurança e previsibilidade.",
    path: "/solucoes/para-plataformas-digitais",
    keywords: [...COMMON_KEYWORDS, "capital de giro", "crédito empresarial"],
  },

  solucoesParaNegociosRecorrentes: {
    title: "Consultoria de Crédito",
    description:
      "Atendimento próximo para orientar a escolha da melhor solução de crédito para cada necessidade.",
    path: "/solucoes/para-negocios-recorrentes",
    keywords: [...COMMON_KEYWORDS, "consultoria de crédito", "atendimento humanizado"],
  },

  termsOfServices: {
    title: "Termos de Serviço",
    description:
      "Consulte os termos que regem o uso dos canais e serviços da Credpagos.",
    path: "/terms-of-services",
    keywords: [...COMMON_KEYWORDS, "termos de uso", "termos de serviço"],
  },

  privacyPolicy: {
    title: "Política de Privacidade",
    description:
      "Entenda como a Credpagos coleta, utiliza e protege dados pessoais.",
    path: "/privacy-policy",
    keywords: [...COMMON_KEYWORDS, "política de privacidade", "dados pessoais"],
  },

  cookiePolicy: {
    title: "Política de Cookies",
    description:
      "Saiba como a Credpagos utiliza cookies e como você pode gerenciar preferências.",
    path: "/cookie-policy",
    keywords: [...COMMON_KEYWORDS, "política de cookies", "cookies"],
  },
};

export function buildPageMetadata(pageSeo: PageSeo): Metadata {
  if (!pageSeo) {
    return buildPageMetadata(HOME_SEO);
  }

  const absoluteUrl = new URL(pageSeo.path, SITE_URL).toString();

  return {
    title: pageSeo.title,
    description: pageSeo.description,
    keywords: pageSeo.keywords,
    alternates: {
      canonical: absoluteUrl,
    },
    openGraph: {
      title: pageSeo.title,
      description: pageSeo.description,
      url: absoluteUrl,
      siteName: SITE_NAME,
      locale: "pt_BR",
      type: "website",
      images: [SOCIAL_SHARE_IMAGE_URL],
    },
    twitter: {
      card: "summary_large_image",
      title: pageSeo.title,
      description: pageSeo.description,
      images: [SOCIAL_SHARE_IMAGE_URL],
    },
  };
}

export function buildServiceMetadata(service: Service): Metadata {
  return buildDetailMetadata(service, `/solucoes/${service.slug}`);
}

type SegmentServiceMetadataOptions = {
  segmentTitle: string;
  segmentKeywords: string[];
};

export function buildDetailMetadata(
  detail: SlugPageDetail,
  path: string,
): Metadata {
  const absoluteUrl = new URL(path, SITE_URL).toString();

  return {
    title: detail.title,
    description: detail.seoDescription,
    keywords: [...COMMON_KEYWORDS, ...detail.seoKeywords],
    alternates: {
      canonical: absoluteUrl,
    },
    openGraph: {
      title: `${detail.title} | ${SITE_NAME}`,
      description: detail.seoDescription,
      url: absoluteUrl,
      siteName: SITE_NAME,
      locale: "pt_BR",
      type: "website",
      images: [SOCIAL_SHARE_IMAGE_URL],
    },
    twitter: {
      card: "summary_large_image",
      title: `${detail.title} | ${SITE_NAME}`,
      description: detail.seoDescription,
      images: [SOCIAL_SHARE_IMAGE_URL],
    },
  };
}

export function buildSegmentServiceMetadata(
  detail: SlugPageDetail,
  path: string,
  options: SegmentServiceMetadataOptions,
): Metadata {
  const absoluteUrl = new URL(path, SITE_URL).toString();
  const title = `${options.segmentTitle} | ${detail.title}`;
  const description = detail.seoDescription;

  return {
    title,
    description,
    keywords: [
      ...COMMON_KEYWORDS,
      ...options.segmentKeywords,
      ...detail.seoKeywords,
    ],
    alternates: {
      canonical: absoluteUrl,
    },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: absoluteUrl,
      siteName: SITE_NAME,
      locale: "pt_BR",
      type: "website",
      images: [SOCIAL_SHARE_IMAGE_URL],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [SOCIAL_SHARE_IMAGE_URL],
    },
  };
}
