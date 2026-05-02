import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fromUnknownError, InternalApiError, parseJsonBody } from "@/lib/admin-interno/api";
import {
  closeConversationForVisitorInactivityByToken,
  countRecentConversationCreatesByIp,
  ensurePublicConversation,
  getConversationProtocolState,
  getPublicConversation,
} from "@/lib/admin-interno/chat";
import {
  ANALYTICS_SESSION_COOKIE,
  ANALYTICS_VISITOR_COOKIE,
  CHAT_VISITOR_COOKIE,
  CHAT_VISITOR_COOKIE_MAX_AGE,
  CHAT_VISITOR_IDLE_TIMEOUT_MS,
} from "@/lib/admin-interno/constants";
import { getRequestIp, getUserAgent, requireTrustedOrigin } from "@/lib/admin-interno/http";
import { maskIpAddress } from "@/lib/admin-interno/sanitize";
import { chatSessionSchema } from "@/lib/admin-interno/validators";

function serializeConversation(conversation: NonNullable<Awaited<ReturnType<typeof getPublicConversation>>>["conversation"]) {
  const protocol = getConversationProtocolState(conversation);
  return {
    id: conversation.id,
    visitorName: conversation.visitorName,
    visitorEmail: conversation.visitorEmail,
    visitorPhone: conversation.visitorPhone,
    status: conversation.status,
    priority: conversation.priority,
    assignedTo: conversation.assignedTo,
    unreadForVisitor: conversation.unreadForVisitor,
    lastMessageAt: conversation.lastMessageAt,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    protocol,
  };
}

function serializeMessages(messages: NonNullable<Awaited<ReturnType<typeof getPublicConversation>>>["messages"]) {
  return messages.map((item) => ({
    id: item.id,
    senderType: item.senderType,
    body: item.body,
    createdAt: item.createdAt,
    senderAdmin: item.senderAdmin
      ? {
          id: item.senderAdmin.id,
          fullName: item.senderAdmin.fullName,
        }
      : null,
  }));
}

export async function POST(request: NextRequest) {
  const ipMasked = maskIpAddress(getRequestIp(request));
  const userAgent = getUserAgent(request).slice(0, 500);

  try {
    requireTrustedOrigin(request);

    const profile = chatSessionSchema.parse(await parseJsonBody(request, 24_000));
    const currentToken = request.cookies.get(CHAT_VISITOR_COOKIE)?.value ?? null;
    let tokenToUse = currentToken;

    if (currentToken) {
      const timeoutResult = await closeConversationForVisitorInactivityByToken({
        visitorToken: currentToken,
        timeoutMs: CHAT_VISITOR_IDLE_TIMEOUT_MS,
        ipMasked,
        userAgent,
      });

      if (timeoutResult.shouldRestart) {
        if (timeoutResult.reason === "VISITOR_TIMEOUT" || timeoutResult.reason === "ALREADY_CLOSED") {
          const payload = await getPublicConversation(currentToken);
          if (
            payload &&
            (payload.conversation.status === "ARCHIVED" || payload.conversation.status === "RESOLVED")
          ) {
            const closedResponse = NextResponse.json({
              success: true,
              data: {
                conversation: serializeConversation(payload.conversation),
                messages: serializeMessages(payload.messages),
              },
            });

            closedResponse.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
            return closedResponse;
          }
        }

        tokenToUse = null;
      }
    }

    if (!tokenToUse) {
      const recentConversations = await countRecentConversationCreatesByIp(ipMasked, 15 * 60_000);
      if (recentConversations >= 25) {
        throw new InternalApiError(429, "CHAT_RATE_LIMIT", "Muitas tentativas. Aguarde alguns minutos.");
      }
    }

    const ensured = await ensurePublicConversation({
      visitorToken: tokenToUse,
      profile: {
        ...profile,
        name: null,
        phone: null,
      },
      ipMasked,
      userAgent,
      analyticsExternalVisitorId: request.cookies.get(ANALYTICS_VISITOR_COOKIE)?.value ?? null,
      analyticsExternalSessionId: request.cookies.get(ANALYTICS_SESSION_COOKIE)?.value ?? null,
    });

    const payload = await getPublicConversation(ensured.visitorToken);
    if (!payload) {
      throw new InternalApiError(404, "CHAT_CONVERSATION_NOT_FOUND", "Conversa não encontrada.");
    }

    const response = NextResponse.json({
      success: true,
      data: {
        conversation: serializeConversation(payload.conversation),
        messages: serializeMessages(payload.messages),
      },
    });

    if (ensured.shouldSetCookie || !tokenToUse) {
      response.cookies.set({
        name: CHAT_VISITOR_COOKIE,
        value: ensured.visitorToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: CHAT_VISITOR_COOKIE_MAX_AGE,
      });
    }

    response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    return response;
  } catch (error) {
    return fromUnknownError(error);
  }
}
