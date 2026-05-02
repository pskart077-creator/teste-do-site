import type { Metadata } from "next";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import LegalPage, { type LegalSection } from "@/components/legal/LegalPage";
import PrivacyHero from "@/components/legal/PolicyHero";
import { STATIC_PAGE_SEO, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata(
  STATIC_PAGE_SEO.privacyPolicy,
);

const privacySections: LegalSection[] = [
  {
    title: "1. Dados que Coletamos",
    paragraphs: [
      "Podemos coletar dados de identificação, contato, navegação e interação com nossos canais para viabilizar atendimento e prestação de serviços.",
      "A coleta ocorre por formulários, cookies, atendimento e integrações necessárias para a operação da plataforma.",
    ],
  },
  {
    title: "2. Como Utilizamos os Dados",
    paragraphs: [
      "Usamos seus dados para autenticação, segurança, suporte, comunicações, melhoria da experiência e cumprimento de obrigações legais.",
      "Também podemos utilizar informações de forma agregada e anonimizada para análises internas.",
    ],
  },
  {
    title: "3. Compartilhamento",
    paragraphs: [
      "Seus dados podem ser compartilhados com instituições parceiras, fornecedores e autoridades competentes, quando necessário.",
      "Todo compartilhamento ocorre conforme as bases legais aplicáveis e com medidas de segurança proporcionais.",
    ],
  },
  {
    title: "4. Armazenamento e Segurança",
    paragraphs: [
      "Mantemos controles técnicos e administrativos para proteger dados pessoais contra acesso não autorizado, perda e alteração indevida.",
      "Os dados são mantidos pelo prazo necessário para cumprir finalidades legítimas e obrigações regulatórias.",
    ],
  },
  {
    title: "5. Seus Direitos",
    paragraphs: [
      "Você pode solicitar confirmação de tratamento, acesso, correção, portabilidade, anonimização, bloqueio ou eliminação de dados, quando aplicável.",
      "Solicitações podem ser feitas pelos canais oficiais de atendimento da Credpagos.",
    ],
    bullets: [
      "Confirmação e acesso aos dados tratados",
      "Correção de dados incompletos, inexatos ou desatualizados",
      "Revogação de consentimento e informação sobre compartilhamentos",
    ],
  },
  {
    title: "6. Atualizações desta Política",
    paragraphs: [
      "Esta Política de Privacidade pode ser revisada periodicamente para refletir mudanças legais ou melhorias operacionais.",
      "A data da última atualização será sempre exibida neste documento.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <PrivacyHero />
      <LegalPage
        eyebrow="Credpagos LEGAL"
        title="Política de Privacidade"
        lastUpdated="14 de abril de 2026"
        intro="Esta política descreve como a Credpagos coleta, utiliza e protege dados pessoais."
        sections={privacySections}
      />
      <SiteFooter />
    </>
  );
}