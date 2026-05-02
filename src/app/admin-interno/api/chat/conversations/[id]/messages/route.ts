import type { NextRequest } from "next/server";
import { fromUnknownError, InternalApiError, ok, parseJsonBody } from "@/lib/admin-interno/api";
import { requireInternalApiSession } from "@/lib/admin-interno/auth";
import { createAdminMessage, getAdminConversationById } from "@/lib/admin-interno/chat";
import { chatAdminMessageSchema } from "@/lib/admin-interno/validators";

function asKnownError(error: unknown) {
  if (!(error instanceof Error)) {
    return null;
  }

  if (error.message === "CHAT_CONVERSATION_NOT_FOUND") {
    return new InternalApiError(404, "CHAT_CONVERSATION_NOT_FOUND", "Conversa não encontrada.");
  }

  if (error.message === "CHAT_MESSAGE_EMPTY") {
    return new InternalApiError(400, "CHAT_MESSAGE_EMPTY", "Mensagem obrigatória.");
  }

  if (error.message === "CHAT_CONVERSATION_ASSIGNED_TO_OTHER") {
    return new InternalApiError(
      409,
      "CHAT_CONVERSATION_ASSIGNED_TO_OTHER",
      "Conversa já assumida por outro atendente.",
    );
  }

  if (error.message === "CHAT_CONVERSATION_CLOSED") {
    return new InternalApiError(
      409,
      "CHAT_CONVERSATION_CLOSED",
      "Conversa encerrada. Reabra para continuar.",
    );
  }

  return null;
}

export async function POST(
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
    const body = chatAdminMessageSchema.parse(await parseJsonBody(request, 24_000));

    await createAdminMessage({
      conversationId: id,
      actorId: session.userId,
      message: body.message,
    });

    const conversation = await getAdminConversationById(id);
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
