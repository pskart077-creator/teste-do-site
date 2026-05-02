import type { NextRequest } from "next/server";
import { fromUnknownError, InternalApiError, ok, parseJsonBody } from "@/lib/admin-interno/api";
import { requireInternalApiSession } from "@/lib/admin-interno/auth";
import { writeAuditLog } from "@/lib/admin-interno/audit";
import { getAdminConversationById, updateConversationByAdmin } from "@/lib/admin-interno/chat";
import { chatConversationUpdateSchema } from "@/lib/admin-interno/validators";
import { prisma } from "@/lib/db/prisma";

function asKnownError(error: unknown) {
  if (!(error instanceof Error)) {
    return null;
  }

  if (error.message === "CHAT_CONVERSATION_NOT_FOUND") {
    return new InternalApiError(404, "CHAT_CONVERSATION_NOT_FOUND", "Conversa não encontrada.");
  }

  if (error.message === "CHAT_CONVERSATION_ASSIGNED_TO_OTHER") {
    return new InternalApiError(
      409,
      "CHAT_CONVERSATION_ASSIGNED_TO_OTHER",
      "Conversa já assumida por outro atendente.",
    );
  }

  if (error.message === "CHAT_CONVERSATION_REASSIGN_FORBIDDEN") {
    return new InternalApiError(
      409,
      "CHAT_CONVERSATION_REASSIGN_FORBIDDEN",
      "Não é permitido transferir conversa já assumida.",
    );
  }

  return null;
}

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const session = await requireInternalApiSession(request, {
      permission: "chat:read",
    });

    const { id } = await context.params;
    const conversation = await getAdminConversationById(id);
    if (!conversation) {
      throw new InternalApiError(404, "CHAT_CONVERSATION_NOT_FOUND", "Conversa não encontrada.");
    }

    const trackView = request.nextUrl.searchParams.get("trackView");
    if (trackView === "1" || trackView === "true") {
      await writeAuditLog({
        actorId: session.userId,
        action: "CHAT_CONVERSATION_VIEWED",
        entityType: "chat_conversation",
        entityId: conversation.id,
      });
    }

    return ok(conversation);
  } catch (error) {
    const known = asKnownError(error);
    if (known) {
      return fromUnknownError(known);
    }
    return fromUnknownError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const session = await requireInternalApiSession(request, {
      permission: "chat:manage",
      requireCsrf: true,
    });

    const { id } = await context.params;
    const body = chatConversationUpdateSchema.parse(await parseJsonBody(request, 20_000));

    if (Object.prototype.hasOwnProperty.call(body, "assignedToId") && body.assignedToId) {
      const assignee = await prisma.internalAdminUser.findFirst({
        where: {
          id: body.assignedToId,
          isActive: true,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

      if (!assignee) {
        throw new InternalApiError(404, "ASSIGNEE_NOT_FOUND", "Responsável não encontrado.");
      }
    }

    const conversation = await updateConversationByAdmin({
      conversationId: id,
      actorId: session.userId,
      status: body.status,
      priority: body.priority,
      ...(Object.prototype.hasOwnProperty.call(body, "assignedToId")
        ? { assignedToId: body.assignedToId ?? null }
        : {}),
    });

    if (!conversation) {
      throw new InternalApiError(404, "CHAT_CONVERSATION_NOT_FOUND", "Conversa não encontrada.");
    }

    return ok({
      conversation,
    });
  } catch (error) {
    const known = asKnownError(error);
    if (known) {
      return fromUnknownError(known);
    }
    return fromUnknownError(error);
  }
}
