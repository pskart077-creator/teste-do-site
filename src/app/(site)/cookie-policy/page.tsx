import type { Metadata } from "next";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import CookiePolicyHero from "@/components/legal/CookiesHero";
import LegalPage, { type LegalSection } from "@/components/legal/LegalPage";
import { STATIC_PAGE_SEO, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata(
  STATIC_PAGE_SEO.cookiePolicy,
);

const cookieSections: LegalSection[] = [
  {
    title: "1. O que são Cookies",
    paragraphs: [
      "Cookies são pequenos arquivos armazenados no seu navegador para lembrar preferências e apoiar o funcionamento da plataforma.",
      "Eles ajudam a oferecer uma experiência mais estável, segura e personalizada.",
    ],
  },
  {
    title: "2. Tipos de Cookies Utilizados",
    paragraphs: [
      "Utilizamos diferentes categorias de cookies para finalidades específicas.",
    ],
    bullets: [
      "Essenciais: necessários para autenticação, segurança e funcionamento básico.",
      "Desempenho: medem o comportamento de uso para melhoria contínua.",
      "Funcionais: guardam preferências como idioma e configurações.",
      "Analíticos e marketing: apoiam a mensuração de campanhas e a comunicação relevante.",
    ],
  },
  {
    title: "3. Gerenciamento de Preferências",
    paragraphs: [
      "Você pode ajustar o uso de cookies pelo banner de consentimento, pelas configurações do navegador ou por ferramentas de terceiros.",
      "A desativação de cookies essenciais pode impactar funcionalidades da plataforma.",
    ],
  },
  {
    title: "4. Prazo de Retenção",
    paragraphs: [
      "Alguns cookies expiram ao encerrar a sessão, enquanto outros permanecem por prazo determinado para lembrar preferências.",
      "Os períodos de retenção são definidos conforme a finalidade, a necessidade técnica e os requisitos regulatórios.",
    ],
  },
  {
    title: "5. Atualizações da Política de Cookies",
    paragraphs: [
      "A Política de Cookies pode ser atualizada para refletir mudanças técnicas, legais ou de governança de dados.",
      "Sempre que houver alteração relevante, a versão vigente será publicada nesta página.",
    ],
  },
];

export default function CookiePolicyPage() {
  return (
    <>
      <CookiePolicyHero />
      <LegalPage
        eyebrow="Credpagos LEGAL"
        title="Política de Cookies"
        lastUpdated="14 de abril de 2026"
        intro="Esta política explica quais cookies utilizamos e como você pode gerenciar suas preferências."
        sections={cookieSections}
      />
      <SiteFooter />
    </>
  );
}