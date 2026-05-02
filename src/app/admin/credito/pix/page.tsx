import { AdminPixManager } from "@/components/credito/AdminPixManager";
import { prisma } from "@/lib/db/prisma";

export default async function AdminCreditoPixPage() {
  const [applications, charges] = await Promise.all([
    prisma.creditApplication.findMany({
      include: {
        customer: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 40,
    }),
    prisma.pixCharge.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 30,
    }),
  ]);

  return (
    <AdminPixManager
      applications={applications.map((item) => ({
        id: item.id,
        protocol: item.protocol,
        customerName: item.customer.name,
      }))}
      initialCharges={charges}
    />
  );
}
