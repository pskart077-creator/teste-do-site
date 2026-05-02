import type { ReactNode } from "react";
import Link from "next/link";
import { requireServerAdmin } from "@/lib/news/auth";
import "@/styles/credito-system.css";

export default async function AdminCreditoLayout({ children }: { children: ReactNode }) {
  const session = await requireServerAdmin();

  const navItems = [
    { href: "/admin/credito", label: "Dashboard" },
    { href: "/admin/credito/solicitacoes", label: "Solicitações" },
    { href: "/admin/credito/propostas", label: "Propostas" },
    { href: "/admin/credito/contratos", label: "Contratos" },
    { href: "/admin/credito/pix", label: "PIX" },
    { href: "/admin/credito/regras", label: "Regras" },
    { href: "/admin/credito/auditoria", label: "Auditoria" },
  ];

  return (
    <section className="credpagos-credito-page">
      <div className="credpagos-credito-container">
        <header className="credpagos-credito-header">
          <span className="credpagos-credito-eyebrow">Admin Crédito</span>
          <h1 className="credpagos-credito-title">Painel de crédito Credpagos</h1>
          <p className="credpagos-credito-subtitle">Usuário autenticado: {session.displayName}</p>
          <nav className="credpagos-admin-actions" aria-label="Navegação do painel de crédito">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="credpagos-credito-button credpagos-credito-button--ghost">
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        {children}
      </div>
    </section>
  );
}
