import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import { ClientLoginForm } from "@/components/credito/ClientLoginForm";

export const metadata: Metadata = {
  title: "Login do Cliente | Credpagos",
  robots: { index: false, follow: false },
};

export default function ClienteLoginPage() {
  return (
    <>
      <section className="credpagos-credito-page">
        <div className="credpagos-credito-container">
          <header className="credpagos-credito-header">
            <h1 className="credpagos-credito-title">Área do Cliente</h1>
            <p className="credpagos-credito-subtitle">
              Entre para acompanhar sua solicitação, proposta, contrato e status de liberação.
            </p>
          </header>
          <article className="credpagos-credito-card credpagos-status-card">
            <ClientLoginForm />
            <p>
              Ainda não tem acesso?{" "}
              <Link href="/cliente/cadastro" className="credpagos-credito-button credpagos-credito-button--ghost">
                Criar conta
              </Link>
            </p>
          </article>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
