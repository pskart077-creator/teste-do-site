import type { Metadata } from "next";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import { CreditWizard } from "@/components/credito/CreditWizard";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Solicitação MEI",
  description: "Wizard de solicitação de crédito para MEI na Credpagos.",
  path: "/solicitacao/mei",
  keywords: ["credpagos", "crédito mei", "capital de giro mei"],
});

export default function SolicitacaoMeiPage() {
  return (
    <>
      <section className="credpagos-credito-page">
        <div className="credpagos-credito-container">
          <header className="credpagos-credito-header">
            <h1 className="credpagos-credito-title">Solicitação de crédito - MEI</h1>
            <p className="credpagos-credito-subtitle">
              Informe os dados do responsável e da empresa para iniciarmos sua análise.
              Condições conforme perfil e avaliação.
            </p>
          </header>
          <CreditWizard mode="MEI" />
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
