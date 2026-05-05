import type { Metadata } from "next";
import { CardRequestFlow } from "@/components/credito/CardRequestFlow";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Solicitar Cartao CredPagos",
  description: "Solicite seu cartao CredPagos em poucos passos.",
  path: "/simular-credito",
  keywords: ["credpagos", "cartao de credito", "solicitar cartao"],
});

export default function SimularCreditoPage() {
  return (
    <>
      <section className="credpagos-credito-page credpagos-card-page">
        <div className="credpagos-credito-container">
          <CardRequestFlow />
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
