import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import { ClientApplicationsPanel } from "@/components/credito/ClientApplicationsPanel";
import { ClientLogoutButton } from "@/components/credito/ClientLogoutButton";
import { requireCreditClientSession } from "@/lib/credit/auth";
import { prisma } from "@/lib/db/prisma";

export const metadata: Metadata = {
  title: "Dashboard do Cliente | Credpagos",
  robots: { index: false, follow: false },
};

export default async function ClienteDashboardPage() {
  const session = await requireCreditClientSession();

  const profiles = await prisma.customerProfile.findMany({
    where: {
      userId: session.userId,
    },
    include: {
      applications: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          proposals: { orderBy: { createdAt: "desc" }, take: 1 },
          contracts: { orderBy: { createdAt: "desc" }, take: 1 },
          history: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });

  const applications = profiles.flatMap((profile) => profile.applications);
  const stats = {
    inAnalysis: applications.filter((item) => item.status === "IN_ANALYSIS").length,
    proposals: applications.filter((item) => item.status === "PROPOSAL_AVAILABLE").length,
    contracts: applications.filter((item) => item.status === "CONTRACT_SIGNED").length,
    released: applications.filter((item) => item.status === "CREDIT_RELEASED").length,
  };

  return (
    <>
      <section className="credpagos-credito-page">
        <div className="credpagos-credito-container">
          <header className="credpagos-credito-header">
            <span className="credpagos-credito-eyebrow">Área do Cliente</span>
            <h1 className="credpagos-credito-title">Olá, {session.user.name}</h1>
            <p className="credpagos-credito-subtitle">
              Aqui você acompanha suas solicitações, propostas, contratos e evolução do processo.
            </p>
            <div className="credpagos-admin-actions">
              <Link href="/simular-credito" className="credpagos-credito-button credpagos-credito-button--primary">
                Nova simulação
              </Link>
              <ClientLogoutButton />
            </div>
          </header>

          <div className="credpagos-admin-metrics">
            <article className="credpagos-admin-metric">
              <div className="credpagos-admin-metric-label">Solicitações em análise</div>
              <div className="credpagos-admin-metric-value">{stats.inAnalysis}</div>
            </article>
            <article className="credpagos-admin-metric">
              <div className="credpagos-admin-metric-label">Propostas disponíveis</div>
              <div className="credpagos-admin-metric-value">{stats.proposals}</div>
            </article>
            <article className="credpagos-admin-metric">
              <div className="credpagos-admin-metric-label">Contratos assinados</div>
              <div className="credpagos-admin-metric-value">{stats.contracts}</div>
            </article>
            <article className="credpagos-admin-metric">
              <div className="credpagos-admin-metric-label">Créditos liberados</div>
              <div className="credpagos-admin-metric-value">{stats.released}</div>
            </article>
          </div>

          <ClientApplicationsPanel applications={applications} />
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
