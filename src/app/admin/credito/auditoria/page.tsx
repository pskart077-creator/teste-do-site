import { AuditTimeline } from "@/components/credito/AuditTimeline";
import { prisma } from "@/lib/db/prisma";

export default async function AdminCreditoAuditoriaPage() {
  const history = await prisma.creditApplicationStatusHistory.findMany({
    include: {
      application: {
        select: {
          protocol: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 120,
  });

  return (
    <AuditTimeline
      items={history.map((entry) => ({
        id: entry.id,
        action: `${entry.fromStatus ?? "N/A"} -> ${entry.toStatus}`,
        entity: `Solicitação ${entry.application.protocol}`,
        entityId: entry.applicationId,
        ip: null,
        createdAt: entry.createdAt,
      }))}
    />
  );
}
