import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import { ClientSignupForm } from "@/components/credito/ClientSignupForm";

export const metadata: Metadata = {
  title: "Cadastro do Cliente | Credpagos",
  robots: { index: false, follow: false },
};

export default function ClienteCadastroPage() {
  return (
    <>
      <section className="credpagos-credito-page">
        <div className="credpagos-credito-container">
          <header className="credpagos-credito-header">
            <h1 className="credpagos-credito-title">Criar acesso do cliente</h1>
            <p className="credpagos-credito-subtitle">
              Cadastre seu acesso para acompanhar solicitações, propostas e contratos.
            </p>
          </header>
          <article className="credpagos-credito-card credpagos-status-card">
            <ClientSignupForm />
            <p>
              Já possui conta?{" "}
              <Link href="/cliente/login" className="credpagos-credito-button credpagos-credito-button--ghost">
                Fazer login
              </Link>
            </p>
          </article>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
