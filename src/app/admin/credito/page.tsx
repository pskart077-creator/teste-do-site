import { AdminCreditMetrics } from "@/components/credito/AdminCreditMetrics";
import { AdminCreditTable } from "@/components/credito/AdminCreditTable";
import { prisma } from "@/lib/db/prisma";

export default async function AdminCreditoDashboardPage() {
  const applications = await prisma.creditApplication.findMany({
    include: {
      customer: true,
      analysis: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 12,
  });

  const metrics = {
    total: applications.length,
    inAnalysis: applications.filter((item) => item.status === "IN_ANALYSIS").length,
    preApproved: applications.filter(
      (item) => item.status === "PRE_APPROVED" || item.status === "PROPOSAL_AVAILABLE",
    ).length,
    released: applications.filter((item) => item.status === "CREDIT_RELEASED").length,
    requestedVolume: applications.reduce((sum, item) => sum + item.requestedAmount, 0),
    estimatedVolume: applications.reduce((sum, item) => sum + item.estimatedNetAmount, 0),
  };

  return (
    <div className="credpagos-admin-dashboard">
      <AdminCreditMetrics {...metrics} />
      <AdminCreditTable items={applications} />
    </div>
  );
}
