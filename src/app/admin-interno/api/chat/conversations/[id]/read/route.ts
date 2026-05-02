import type { NextRequest } from "next/server";
import { fromUnknownError, ok } from "@/lib/admin-interno/api";
import { requireInternalApiSession } from "@/lib/admin-interno/auth";
import { markConversationReadByAdmin } from "@/lib/admin-interno/chat";

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    await requireInternalApiSession(request, {
      permission: "chat:read",
      requireCsrf: true,
    });

    const { id } = await context.params;
    await markConversationReadByAdmin(id);

    return ok({
      read: true,
    });
  } catch (error) {
    return fromUnknownError(error);
  }
}
