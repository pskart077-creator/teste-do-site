import { CrmClient } from "@/components/admin-interno/crm-client";
import { requireInternalPageSession } from "@/lib/admin-interno/auth";
import { listCrmDeals } from "@/lib/admin-interno/crm";
import { hasPermission } from "@/lib/admin-interno/permissions";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function InternalCrmPage() {
  const session = await requireInternalPageSession("crm:read");
  const canManage = hasPermission(session.role, "crm:manage");

  const [crm, users, leads] = await Promise.all([
    listCrmDeals({
      limit: 150,
    }),
    prisma.internalAdminUser.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        fullName: true,
      },
      orderBy: {
        fullName: "asc",
      },
      take: 80,
    }),
    prisma.lead.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 120,
    }),
  ]);

  return (
    <CrmClient
      canManage={canManage}
      deals={crm.deals}
      byStage={crm.byStage}
      metrics={crm.metrics}
      users={users}
      leads={leads}
    />
  );
}
