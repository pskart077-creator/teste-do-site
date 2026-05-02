import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

export default async function AdminCreditoContratosPage() {
  const contracts = await prisma.creditContract.findMany({
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

  if (!contracts.length) {
    return <div className="credpagos-empty">Nenhum contrato gerado até o momento.</div>;
  }

  return (
    <div className="credpagos-admin-table-wrap">
      <table className="credpagos-admin-table">
        <thead>
          <tr>
            <th>Contrato</th>
            <th>Protocolo</th>
            <th>Cliente</th>
            <th>Status</th>
            <th>Aceite</th>
            <th>IP</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((contract) => (
            <tr key={contract.id}>
              <td>{contract.contractNumber}</td>
              <td>{contract.application.protocol}</td>
              <td>{contract.application.customer.name}</td>
              <td>{contract.status}</td>
              <td>
                {contract.acceptedAt
                  ? new Date(contract.acceptedAt).toLocaleString("pt-BR")
                  : "Pendente"}
              </td>
              <td>{contract.acceptedIp ?? "-"}</td>
              <td>
                <Link
                  href={`/admin/credito/solicitacoes/${contract.applicationId}`}
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
