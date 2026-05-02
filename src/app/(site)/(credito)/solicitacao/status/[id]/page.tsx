import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import { ContractPreview } from "@/components/credito/ContractPreview";
import { CreditStatusBadge } from "@/components/credito/CreditStatusBadge";
import { CreditTimeline } from "@/components/credito/CreditTimeline";
import { PixQRCodeCard } from "@/components/credito/PixQRCodeCard";
import { ProposalCard } from "@/components/credito/ProposalCard";
import { formatCurrencyBrl } from "@/lib/credit/helpers";
import { prisma } from "@/lib/db/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: RouteContext): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Status da solicitação ${id.slice(0, 8)} | Credpagos`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function SolicitacaoStatusPage({ params }: RouteContext) {
  const { id } = await params;
  const application = await prisma.creditApplication.findUnique({
    where: { id },
    include: {
      customer: true,
      documents: true,
      analysis: true,
      proposals: { orderBy: { createdAt: "desc" }, take: 1 },
      contracts: { orderBy: { createdAt: "desc" }, take: 1 },
      pixCharges: { orderBy: { createdAt: "desc" }, take: 1 },
      history: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!application) {
    notFound();
  }

  const pendingDocuments = application.documents.filter((doc) => doc.status !== "APPROVED");
  const latestProposal = application.proposals[0] ?? null;
  const latestContract = application.contracts[0] ?? null;
  const latestPix = application.pixCharges[0] ?? null;
  const isReleased = application.status === "CREDIT_RELEASED";
  const approvedStatuses = [
    "PRE_APPROVED",
    "PROPOSAL_AVAILABLE",
    "PROPOSAL_ACCEPTED",
    "CONTRACT_GENERATED",
    "CONTRACT_SIGNED",
    "AWAITING_RELEASE",
    "CREDIT_RELEASED",
  ];
  const isApproved = approvedStatuses.includes(application.status);
  const approvedAmount =
    latestProposal?.suggestedAmount ?? application.analysis?.suggestedAmount ?? application.requestedAmount;
  const approvedEstimatedNetAmount = latestProposal?.estimatedNetAmount ?? application.estimatedNetAmount;
  const approvedTerm = latestProposal?.term ?? application.analysis?.suggestedTerm ?? application.desiredTerm;

  return (
    <>
      <section className="credpagos-credito-page">
        <div className="credpagos-credito-container">
          <header className="credpagos-credito-header">
            <span className="credpagos-credito-eyebrow">Protocolo {application.protocol}</span>
            <h1 className="credpagos-credito-title">Acompanhamento da solicitação</h1>
            <p className="credpagos-credito-subtitle">
              Visualize o andamento da sua solicitação, proposta e próximas etapas.
            </p>
          </header>

          {isApproved ? (
            <article className="credpagos-approval-card">
              <span className="credpagos-credito-eyebrow">Fase 2 - Aprovação</span>
              <div className="credpagos-approval-hero">
                <div>
                  <p className="credpagos-approval-kicker">Solicitação aprovada</p>
                  <h2>Crédito aprovado</h2>
                  <p>
                    Sua análise inicial foi aprovada. Confira o valor aprovado e siga as próximas
                    etapas da proposta.
                  </p>
                </div>
                <CreditStatusBadge status={application.status} />
              </div>

              <div className="credpagos-approval-amount">
                <span>Valor aprovado</span>
                <strong>{formatCurrencyBrl(approvedAmount)}</strong>
              </div>

              <div className="credpagos-approval-grid">
                <div>
                  <span>Valor solicitado</span>
                  <strong>{formatCurrencyBrl(application.requestedAmount)}</strong>
                </div>
                <div>
                  <span>Valor líquido estimado</span>
                  <strong>{formatCurrencyBrl(approvedEstimatedNetAmount)}</strong>
                </div>
                <div>
                  <span>Prazo aprovado</span>
                  <strong>{approvedTerm} meses</strong>
                </div>
                <div>
                  <span>Protocolo</span>
                  <strong>{application.protocol}</strong>
                </div>
              </div>
            </article>
          ) : null}

          <article className="credpagos-status-card">
            <div className="credpagos-key-value">
              <span>Nome do cliente</span>
              <strong>{application.customer.name}</strong>
            </div>
            <div className="credpagos-key-value">
              <span>Tipo de solicitação</span>
              <strong>{application.profileType}</strong>
            </div>
            <div className="credpagos-key-value">
              <span>Valor solicitado</span>
              <strong>{formatCurrencyBrl(application.requestedAmount)}</strong>
            </div>
            <div className="credpagos-key-value">
              <span>Valor líquido estimado</span>
              <strong>{formatCurrencyBrl(application.estimatedNetAmount)}</strong>
            </div>
            <div className="credpagos-key-value">
              <span>Status atual</span>
              <strong>
                <CreditStatusBadge status={application.status} />
              </strong>
            </div>
            {isReleased ? (
              <p className="credpagos-alert">
                Seu crédito foi liberado. A previsão de crédito em conta será exibida conforme os
                dados bancários informados e a confirmação operacional da Credpagos.
              </p>
            ) : isApproved ? (
              <p className="credpagos-alert">
                Sua solicitação foi aprovada na análise inicial. Continue acompanhando para aceitar a
                proposta e finalizar a contratação.
              </p>
            ) : (
              <p className="credpagos-alert">
                Sua solicitação segue em análise. Você também pode acompanhar pela área do cliente.
              </p>
            )}
          </article>

          <CreditTimeline currentStatus={application.status} history={application.history} />

          {pendingDocuments.length ? (
            <article className="credpagos-status-card">
              <h3 className="credpagos-credito-card-title">Documentos pendentes</h3>
              <ul>
                {pendingDocuments.map((doc) => (
                  <li key={doc.id}>
                    {doc.type} - {doc.status}
                  </li>
                ))}
              </ul>
            </article>
          ) : null}

          {latestProposal ? <ProposalCard proposal={latestProposal} /> : null}
          {latestContract ? (
            <ContractPreview contract={latestContract} accepted={Boolean(latestContract.acceptedAt)} />
          ) : null}
          {latestPix ? <PixQRCodeCard charge={latestPix} /> : null}
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
