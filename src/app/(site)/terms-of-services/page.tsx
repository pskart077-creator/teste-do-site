import type { Metadata } from "next";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import LegalPage, { type LegalSection } from "@/components/legal/LegalPage";
import TermsOfServiceHero from "@/components/legal/TermosHero";
import { STATIC_PAGE_SEO, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata(
  STATIC_PAGE_SEO.termsOfServices,
);

const termsSections: LegalSection[] = [
  {
    title: "1. Aceitação dos Termos",
    paragraphs: [
      "Ao acessar e utilizar os canais da Credpagos, você concorda com estes Termos de Serviço e com as demais políticas aplicáveis.",
      "Caso não concorde com qualquer item, recomendamos interromper o uso da plataforma.",
    ],
  },
  {
    title: "2. Escopo da Plataforma",
    paragraphs: [
      "A Credpagos atua como hub de intermediação de soluções financeiras por meio de instituições parceiras autorizadas.",
      "Determinados produtos, limites e regras operacionais podem variar conforme o parceiro responsável e o perfil de uso.",
    ],
  },
  {
    title: "3. Cadastro e Responsabilidades",
    paragraphs: [
      "Você se compromete a fornecer informações corretas, atualizadas e completas durante o cadastro e ao longo da relação.",
      "Também é sua responsabilidade manter a confidencialidade de credenciais e dispositivos utilizados para acesso.",
    ],
  },
  {
    title: "4. Uso Permitido",
    paragraphs: [
      "Não é permitido utilizar a plataforma para práticas ilícitas, tentativas de fraude, violação de segurança ou qualquer atividade que possa prejudicar terceiros.",
      "A Credpagos pode suspender acessos em caso de uso indevido, suspeita de irregularidade ou descumprimento destes termos.",
    ],
  },
  {
    title: "5. Propriedade Intelectual",
    paragraphs: [
      "Marcas, identidade visual, textos, interfaces e demais conteúdos da Credpagos são protegidos pela legislação aplicável.",
      "É vedada a reprodução, distribuição ou o uso comercial sem autorização prévia e expressa.",
    ],
  },
  {
    title: "6. Alterações dos Termos",
    paragraphs: [
      "Estes termos podem ser atualizados para refletir mudanças legais, regulatórias ou operacionais.",
      "A versão vigente será sempre disponibilizada nesta página com a data da última atualização.",
    ],
  },
];

export default function TermsOfServicesPage() {
  return (
    <>
      <TermsOfServiceHero />
      <LegalPage
        eyebrow="Credpagos LEGAL"
        title="Termos de Serviço"
        lastUpdated="14 de abril de 2026"
        intro="Estes termos definem as condições de uso dos serviços e canais digitais da Credpagos."
        sections={termsSections}
      />
      <SiteFooter />
    </>
  );
}