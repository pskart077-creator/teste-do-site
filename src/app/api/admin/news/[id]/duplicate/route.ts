import { NewsAuditAction, UserRole } from "@prisma/client";
import type { NextRequest } from "next/server";
import { ApiError, fromUnknownError, ok } from "@/lib/news/api";
import { writeAuditLog } from "@/lib/news/audit";
import { requireApiAdmin } from "@/lib/news/auth";
import { RATE_LIMIT_WINDOWS } from "@/lib/news/constants";
import { asRateLimitResponse, getRequestIp, getUserAgent, requireRateLimit } from "@/lib/news/http";
import { duplicateNewsPost } from "@/lib/news/queries";
import { assertSingleUseNonce } from "@/lib/news/rate-limit";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const ipAddress = getRequestIp(request);
  const userAgent = getUserAgent(request);

  try {
    requireRateLimit(`admin-api:${ipAddress}`, RATE_LIMIT_WINDOWS.adminApi);

    const session = await requireApiAdmin(request, {
      allowedRoles: [UserRole.SUPER_ADMIN, UserRole.EDITOR, UserRole.AUTHOR],
      requireCsrf: true,
    });

    const requestId = request.headers.get("x-request-id");
    if (!requestId || requestId.length > 120) {
      throw new ApiError(400, "REQUEST_ID_REQUIRED", "Cabecalho x-request-id obrigatorio.");
    }

    if (!assertSingleUseNonce(session.sessionId, requestId)) {
      throw new ApiError(409, "REPLAY_DETECTED", "Requisicao repetida detectada.");
    }

    const { id } = await context.params;
    const post = await duplicateNewsPost(id, session);

    await writeAuditLog({
      action: NewsAuditAction.DUPLICATE,
      actorId: session.id,
      entityType: "news_post",
      entityId: post?.id,
      description: "Notícia duplicada no painel administrativo.",
      metadata: {
        sourcePostId: id,
      },
      ipAddress,
      userAgent,
    });

    return ok({ post }, { status: 201 });
  } catch (error) {
    return asRateLimitResponse(error) ?? fromUnknownError(error);
  }
}
