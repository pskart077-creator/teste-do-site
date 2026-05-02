import { notFound } from "next/navigation";
import { AdminApplicationActions } from "@/components/credito/AdminApplicationActions";
import { CreditStatusBadge } from "@/components/credito/CreditStatusBadge";
import { CreditTimeline } from "@/components/credito/CreditTimeline";
import { ProposalCard } from "@/components/credito/ProposalCard";
import { RiskScoreCard } from "@/components/credito/RiskScoreCard";
import { formatCurrencyBrl } from "@/lib/credit/helpers";
import { prisma } from "@/lib/db/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminCreditoSolicitacaoDetalhePage({ params }: RouteContext) {
  const { id } = await params;
  const application = await prisma.creditApplication.findUnique({
    where: { id },
    include: {
      customer: true,
      personData: true,
      companyData: true,
      partners: true,
      addresses: true,
      bankData: true,
      documents: true,
      analysis: true,
      proposals: { orderBy: { createdAt: "desc" }, take: 1 },
      contracts: { orderBy: { createdAt: "desc" }, take: 1 },
      pixCharges: { orderBy: { createdAt: "desc" }, take: 5 },
      history: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!application) {
    notFound();
  }

  const proposal = application.proposals[0] ?? null;

  return (
    <div className="credpagos-admin-dashboard">
      <article className="credpagos-status-card">
        <h2 className="credpagos-credito-card-title">Resumo da solicitação</h2>
        <div className="credpagos-key-value">
          <span>Protocolo</span>
          <strong>{application.protocol}</strong>
        </div>
        <div className="credpagos-key-value">
          <span>Status</span>
          <strong>
            <CreditStatusBadge status={application.status} />
          </strong>
        </div>
        <div className="credpagos-key-value">
          <span>Tipo de perfil</span>
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
          <span>Cliente</span>
          <strong>
            {application.customer.name} ({application.customer.document})
          </strong>
        </div>
      </article>

      {application.analysis ? (
        <RiskScoreCard
          score={application.analysis.score}
          riskLevel={application.analysis.riskLevel}
          recommendation={application.analysis.recommendation}
          reasons={
            Array.isArray(application.analysis.reasons)
              ? application.analysis.reasons.map((item) => String(item))
              : []
          }
          notes={application.analysis.internalNotes}
        />
      ) : null}

      <CreditTimeline currentStatus={application.status} history={application.history} />

      <article className="credpagos-status-card">
        <h3 className="credpagos-credito-card-title">Documentos enviados</h3>
        <ul>
          {application.documents.map((doc) => (
            <li key={doc.id}>
              {doc.type} - {doc.status} - {doc.fileName}
            </li>
          ))}
        </ul>
      </article>

      {proposal ? <ProposalCard proposal={proposal} /> : null}
      <AdminApplicationActions applicationId={application.id} />
    </div>
  );
}
