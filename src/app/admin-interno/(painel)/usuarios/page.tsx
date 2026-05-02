import { UsersClient } from "@/components/admin-interno/users-client";
import { requireInternalPageSession } from "@/lib/admin-interno/auth";
import { hasPermission } from "@/lib/admin-interno/permissions";
import { prisma } from "@/lib/db/prisma";

export default async function InternalUsersPage() {
  const session = await requireInternalPageSession("users:read");

  const users = await prisma.internalAdminUser.findMany({
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      isActive: true,
      role: {
        select: {
          key: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <UsersClient
      users={users}
      canManage={hasPermission(session.role, "users:manage")}
    />
  );
}
