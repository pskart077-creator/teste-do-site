import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fromUnknownError, InternalApiError, parseJsonBody } from "@/lib/admin-interno/api";
import {
  closeConversationForVisitorInactivityByToken,
  countRecentVisitorMessagesByIp,
  createVisitorMessage,
  ensurePublicConversation,
  getConversationProtocolState,
  getPublicConversation,
  markConversationReadByVisitor,
} from "@/lib/admin-interno/chat";
import {
  ANALYTICS_SESSION_COOKIE,
  ANALYTICS_VISITOR_COOKIE,
  CHAT_VISITOR_COOKIE,
  CHAT_VISITOR_COOKIE_MAX_AGE,
  CHAT_VISITOR_IDLE_TIMEOUT_MS,
} from "@/lib/admin-interno/constants";
import { getRequestIp, getUserAgent, requireTrustedOrigin } from "@/lib/admin-interno/http";
import { maskIpAddress, sanitizePath } from "@/lib/admin-interno/sanitize";
import { chatVisitorMessageSchema } from "@/lib/admin-interno/validators";

function asDate(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

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

function noStoreJson(payload: unknown) {
  const response = NextResponse.json(payload);
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  return response;
}

function clearChatVisitorCookie(response: NextResponse) {
  response.cookies.set({
    name: CHAT_VISITOR_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function GET(request: NextRequest) {
  const ipMasked = maskIpAddress(getRequestIp(request));
  const userAgent = getUserAgent(request).slice(0, 500);

  try {
    const visitorToken = request.cookies.get(CHAT_VISITOR_COOKIE)?.value ?? null;
    if (!visitorToken) {
      return noStoreJson({
        success: true,
        data: {
          conversation: null,
          messages: [],
        },
      });
    }

    const timeoutResult = await closeConversationForVisitorInactivityByToken({
      visitorToken,
      timeoutMs: CHAT_VISITOR_IDLE_TIMEOUT_MS,
      ipMasked,
      userAgent,
    });
    if (timeoutResult.shouldRestart) {
      if (timeoutResult.reason === "VISITOR_TIMEOUT" || timeoutResult.reason === "ALREADY_CLOSED") {
        const payload = await getPublicConversation(visitorToken);
        if (
          payload &&
          (payload.conversation.status === "ARCHIVED" || payload.conversation.status === "RESOLVED")
        ) {
          return noStoreJson({
            success: true,
            data: {
              conversation: serializeConversation(payload.conversation),
              messages: serializeMessages(payload.messages),
            },
          });
        }
      }

      const response = noStoreJson({
        success: true,
        data: {
          conversation: null,
          messages: [],
        },
      });
      clearChatVisitorCookie(response);
      return response;
    }

    const payload = await getPublicConversation(visitorToken);
    if (!payload) {
      const response = noStoreJson({
        success: true,
        data: {
          conversation: null,
          messages: [],
        },
      });
      clearChatVisitorCookie(response);
      return response;
    }

    const after = asDate(request.nextUrl.searchParams.get("after"));
    const markRead = request.nextUrl.searchParams.get("markRead");
    const shouldMarkRead = markRead === "1" || markRead === "true";

    if (shouldMarkRead && payload.conversation.unreadForVisitor > 0) {
      await markConversationReadByVisitor(payload.conversation.id);
    }

    const filtered = after
      ? payload.messages.filter((item) => item.createdAt.getTime() > after.getTime())
      : payload.messages;

    return noStoreJson({
      success: true,
      data: {
        conversation: {
          ...serializeConversation(payload.conversation),
          unreadForVisitor: shouldMarkRead ? 0 : payload.conversation.unreadForVisitor,
        },
        messages: serializeMessages(filtered),
      },
    });
  } catch (error) {
    return fromUnknownError(error);
  }
}

export async function POST(request: NextRequest) {
  const ipMasked = maskIpAddress(getRequestIp(request));
  const userAgent = getUserAgent(request).slice(0, 500);

  try {
    requireTrustedOrigin(request);

    const recentMinute = await countRecentVisitorMessagesByIp(ipMasked, 60_000);
    if (recentMinute >= 10) {
      throw new InternalApiError(429, "CHAT_RATE_LIMIT", "Muitas mensagens em pouco tempo.");
    }

    const recentQuarter = await countRecentVisitorMessagesByIp(ipMasked, 15 * 60_000);
    if (recentQuarter >= 80) {
      throw new InternalApiError(429, "CHAT_RATE_LIMIT", "Limite temporario de mensagens atingido.");
    }

    const body = chatVisitorMessageSchema.parse(await parseJsonBody(request, 30_000));
    const visitorToken = request.cookies.get(CHAT_VISITOR_COOKIE)?.value ?? null;
    let tokenToUse = visitorToken;
    const refererPath = sanitizePath(request.headers.get("referer"));

    if (visitorToken) {
      const timeoutResult = await closeConversationForVisitorInactivityByToken({
        visitorToken,
        timeoutMs: CHAT_VISITOR_IDLE_TIMEOUT_MS,
        ipMasked,
        userAgent,
        includeWarnings: false,
      });

      if (timeoutResult.shouldRestart) {
        tokenToUse = null;
      }
    }

    const ensured = await ensurePublicConversation({
      visitorToken: tokenToUse,
      profile: {
        ...body.profile,
        name: null,
        phone: null,
        sourcePage: body.profile?.sourcePage ?? refererPath ?? null,
      },
      ipMasked,
      userAgent,
      analyticsExternalVisitorId: request.cookies.get(ANALYTICS_VISITOR_COOKIE)?.value ?? null,
      analyticsExternalSessionId: request.cookies.get(ANALYTICS_SESSION_COOKIE)?.value ?? null,
    });

    await createVisitorMessage({
      conversationId: ensured.conversation.id,
      message: body.message,
      ipMasked,
      userAgent,
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
