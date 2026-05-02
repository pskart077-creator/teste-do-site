import { InternalChatClient } from "@/components/admin-interno/internal-chat-client";
import { requireInternalPageSession } from "@/lib/admin-interno/auth";
import { getAdminConversationById, listAdminConversations } from "@/lib/admin-interno/chat";
import { hasPermission } from "@/lib/admin-interno/permissions";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function InternalChatPage() {
  const session = await requireInternalPageSession("chat:read");
  const canManage = hasPermission(session.role, "chat:manage");

  const [list, users] = await Promise.all([
    listAdminConversations({
      page: 1,
      pageSize: 24,
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
      take: 120,
    }),
  ]);

  const selectedConversationId = list.conversations[0]?.id ?? null;
  const selectedConversation = selectedConversationId
    ? await getAdminConversationById(selectedConversationId)
    : null;

  return (
    <InternalChatClient
      canManage={canManage}
      currentUserId={session.userId}
      initialList={list}
      initialSelectedConversation={selectedConversation}
      users={users}
    />
  );
}
