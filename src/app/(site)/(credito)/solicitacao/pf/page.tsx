import type { Metadata } from "next";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import { CreditWizard } from "@/components/credito/CreditWizard";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Solicitação PF",
  description: "Wizard de solicitação de crédito para pessoa física na Credpagos.",
  path: "/solicitacao/pf",
  keywords: ["credpagos", "crédito pf", "empréstimo pessoal"],
});

export default function SolicitacaoPfPage() {
  return (
    <>
      <section className="credpagos-credito-page">
        <div className="credpagos-credito-container">
          <header className="credpagos-credito-header">
            <h1 className="credpagos-credito-title">Solicitação de crédito - Pessoa Física</h1>
            <p className="credpagos-credito-subtitle">
              Preencha seus dados para iniciar a análise de crédito. Aprovação sujeita à análise
              de dados, documentos e critérios internos.
            </p>
          </header>
          <CreditWizard mode="PF" />
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
