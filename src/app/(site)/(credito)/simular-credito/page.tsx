import type { Metadata } from "next";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import { ProfileTypeSelector } from "@/components/credito/ProfileTypeSelector";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Simular Crédito",
  description:
    "Escolha seu perfil e preencha a solicitação de crédito da Credpagos em poucos passos.",
  path: "/simular-credito",
  keywords: ["credpagos", "simular crédito", "crédito para pf", "crédito para mei", "crédito para pj"],
});

export default function SimularCreditoPage() {
  return (
    <>
      <section className="credpagos-credito-page">
        <div className="credpagos-credito-container">
          <header className="credpagos-credito-header">
            <span className="credpagos-credito-eyebrow">Credpagos Crédito</span>
            <h1 className="credpagos-credito-title">Simule seu crédito com a Credpagos</h1>
            <p className="credpagos-credito-subtitle">
              Escolha seu perfil e preencha uma solicitação em poucos passos. Tenha uma experiência
              simples, segura e organizada para enviar seus dados e acompanhar sua análise.
            </p>
          </header>
          <ProfileTypeSelector />
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
