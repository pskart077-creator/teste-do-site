import type { Metadata } from "next";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import { CreditWizard } from "@/components/credito/CreditWizard";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Solicitação PJ",
  description: "Wizard de solicitação de crédito para pessoa jurídica na Credpagos.",
  path: "/solicitacao/pj",
  keywords: ["credpagos", "crédito pj", "capital de giro empresas"],
});

export default function SolicitacaoPjPage() {
  return (
    <>
      <section className="credpagos-credito-page">
        <div className="credpagos-credito-container">
          <header className="credpagos-credito-header">
            <h1 className="credpagos-credito-title">Solicitação de crédito - Pessoa Jurídica</h1>
            <p className="credpagos-credito-subtitle">
              Cadastre os dados da empresa, sócios e documentos para análise inicial da Credpagos.
            </p>
          </header>
          <CreditWizard mode="PJ" />
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
