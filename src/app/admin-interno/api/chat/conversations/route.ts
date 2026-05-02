import type { NextRequest } from "next/server";
import { fromUnknownError, ok } from "@/lib/admin-interno/api";
import { requireInternalApiSession } from "@/lib/admin-interno/auth";
import { listAdminConversations } from "@/lib/admin-interno/chat";
import { chatConversationQuerySchema } from "@/lib/admin-interno/validators";

export async function GET(request: NextRequest) {
  try {
    await requireInternalApiSession(request, {
      permission: "chat:read",
    });

    const params = request.nextUrl.searchParams;
    const query = chatConversationQuerySchema.parse({
      page: params.get("page") ?? undefined,
      pageSize: params.get("pageSize") ?? undefined,
      status: params.get("status") ?? undefined,
      assignedToId: params.get("assignedToId") ?? undefined,
      q: params.get("q") ?? undefined,
      onlyUnread: params.get("onlyUnread") ?? undefined,
    });

    const result = await listAdminConversations({
      page: query.page,
      pageSize: query.pageSize,
      status: query.status,
      assignedToId: query.assignedToId,
      q: query.q,
      onlyUnread: query.onlyUnread === "1" || query.onlyUnread === "true",
    });

    return ok(result);
  } catch (error) {
    return fromUnknownError(error);
  }
}
