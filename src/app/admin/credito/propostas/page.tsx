import Link from "next/link";
import { formatCurrencyBrl } from "@/lib/credit/helpers";
import { prisma } from "@/lib/db/prisma";

export default async function AdminCreditoPropostasPage() {
  const proposals = await prisma.creditProposal.findMany({
    include: {
      application: {
        include: {
          customer: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 80,
  });

  if (!proposals.length) {
    return <div className="credpagos-empty">Nenhuma proposta cadastrada.</div>;
  }

  return (
    <div className="credpagos-admin-table-wrap">
      <table className="credpagos-admin-table">
        <thead>
          <tr>
            <th>Protocolo</th>
            <th>Cliente</th>
            <th>Status</th>
            <th>Valor solicitado</th>
            <th>Valor sugerido</th>
            <th>Valor líquido</th>
            <th>Prazo</th>
            <th>Parcela</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {proposals.map((proposal) => (
            <tr key={proposal.id}>
              <td>{proposal.application.protocol}</td>
              <td>{proposal.application.customer.name}</td>
              <td>{proposal.status}</td>
              <td>{formatCurrencyBrl(proposal.requestedAmount)}</td>
              <td>{formatCurrencyBrl(proposal.suggestedAmount)}</td>
              <td>{formatCurrencyBrl(proposal.estimatedNetAmount)}</td>
              <td>{proposal.term} meses</td>
              <td>{formatCurrencyBrl(proposal.installmentAmount)}</td>
              <td>
                <Link
                  href={`/admin/credito/solicitacoes/${proposal.applicationId}`}
                  className="credpagos-credito-button credpagos-credito-button--ghost"
                >
                  Ver solicitação
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
