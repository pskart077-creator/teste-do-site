import type { Metadata } from "next";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import { CreditWizard } from "@/components/credito/CreditWizard";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Simular Crédito",
  description:
    "Simule seu crédito na Credpagos em poucos passos.",
  path: "/simular-credito",
  keywords: ["credpagos", "simular crédito", "crédito para pf", "empréstimo pessoal"],
});

export default function SimularCreditoPage() {
  return (
    <>
      <section className="credpagos-credito-page">
        <div className="credpagos-credito-container">
          <CreditWizard mode="PF" />
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
