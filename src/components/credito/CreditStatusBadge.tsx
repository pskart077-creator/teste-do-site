import type { CreditApplicationStatus } from "@prisma/client";
import { statusLabel } from "@/lib/credit/helpers";

type CreditStatusBadgeProps = {
  status: CreditApplicationStatus;
};

function statusVariant(status: CreditApplicationStatus) {
  if (status === "CREDIT_RELEASED" || status === "CONTRACT_SIGNED" || status === "PROPOSAL_ACCEPTED") {
    return "success";
  }
  if (status === "REFUSED" || status === "CANCELED") {
    return "danger";
  }
  if (status === "DOCUMENTS_PENDING" || status === "AWAITING_RELEASE") {
    return "warning";
  }
  return "neutral";
}

export function CreditStatusBadge({ status }: CreditStatusBadgeProps) {
  const variant = statusVariant(status);
  return (
    <span className={`credpagos-status-badge credpagos-status-badge--${variant}`}>
      {statusLabel(status)}
    </span>
  );
}
