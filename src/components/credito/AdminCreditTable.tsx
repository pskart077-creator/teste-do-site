import Link from "next/link";
import type { CreditApplicationStatus } from "@prisma/client";
import { CreditStatusBadge } from "@/components/credito/CreditStatusBadge";
import { formatCurrencyBrl } from "@/lib/credit/helpers";

type AdminCreditTableItem = {
  id: string;
  protocol: string;
  profileType: string;
  status: CreditApplicationStatus;
  requestedAmount: number;
  estimatedNetAmount: number;
  createdAt: string | Date;
  customer?: {
    name: string;
    document: string;
  };
  analysis?: {
    score: number;
    riskLevel: string;
  } | null;
};

type AdminCreditTableProps = {
  items: AdminCreditTableItem[];
};

export function AdminCreditTable({ items }: AdminCreditTableProps) {
  if (!items.length) {
    return (
      <div className="credpagos-empty">
        Nenhuma solicitação encontrada.
      </div>
    );
  }

  return (
    <div className="credpagos-admin-table-wrap">
      <table className="credpagos-admin-table">
        <thead>
          <tr>
            <th>Protocolo</th>
            <th>Cliente</th>
            <th>Perfil</th>
            <th>Valor solicitado</th>
            <th>Valor líquido estimado</th>
            <th>Status</th>
            <th>Risco</th>
            <th>Data</th>
            <th>Ações</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.protocol}</td>

              <td>
                <strong>{item.customer?.name ?? "-"}</strong>
                <br />
                <span>{item.customer?.document ?? "-"}</span>
              </td>

              <td>{item.profileType}</td>
              <td>{formatCurrencyBrl(item.requestedAmount)}</td>
              <td>{formatCurrencyBrl(item.estimatedNetAmount)}</td>

              <td>
                <CreditStatusBadge status={item.status} />
              </td>

              <td>{item.analysis?.riskLevel ?? "-"}</td>
              <td>{new Date(item.createdAt).toLocaleDateString("pt-BR")}</td>

              <td>
                <div className="credpagos-admin-actions">
                  <Link
                    className="credpagos-credito-button credpagos-credito-button--ghost"
                    href={`/admin/credito/solicitacoes/${item.id}`}
                  >
                    Visualizar
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}