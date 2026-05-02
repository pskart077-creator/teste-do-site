import { AdminSolicitacoesClient } from "@/components/credito/AdminSolicitacoesClient";
import { prisma } from "@/lib/db/prisma";

export default async function AdminCreditoSolicitacoesPage() {
  const items = await prisma.creditApplication.findMany({
    include: {
      customer: true,
      analysis: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 60,
  });

  return <AdminSolicitacoesClient initialItems={items} />;
}
