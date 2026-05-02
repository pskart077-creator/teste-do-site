import { NewsAuditAction, UserRole } from "@prisma/client";
import type { NextRequest } from "next/server";
import { ApiError, fromUnknownError, ok, parseJsonBody } from "@/lib/news/api";
import { writeAuditLog } from "@/lib/news/audit";
import { requireApiAdmin } from "@/lib/news/auth";
import { RATE_LIMIT_WINDOWS } from "@/lib/news/constants";
import { asRateLimitResponse, getRequestIp, getUserAgent, requireRateLimit } from "@/lib/news/http";
import { publishNewsPost } from "@/lib/news/queries";
import { assertSingleUseNonce } from "@/lib/news/rate-limit";
import { publishSchema } from "@/lib/news/validators";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const ipAddress = getRequestIp(request);
  const userAgent = getUserAgent(request);

  try {
    requireRateLimit(`admin-api:${ipAddress}`, RATE_LIMIT_WINDOWS.adminApi);

    const session = await requireApiAdmin(request, {
      allowedRoles: [UserRole.SUPER_ADMIN, UserRole.EDITOR],
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
    const body = publishSchema.parse(await parseJsonBody(request, 30_000));
    const post = await publishNewsPost(id, body.publishedAt, session.role);

    await writeAuditLog({
      action: NewsAuditAction.PUBLISH,
      actorId: session.id,
      entityType: "news_post",
      entityId: id,
      description: "Notícia publicada via ação administrativa.",
      metadata: {
        publishedAt: post.publishedAt,
      },
      ipAddress,
      userAgent,
    });

    await writeAuditLog({
      action: NewsAuditAction.STATUS_CHANGE,
      actorId: session.id,
      entityType: "news_post",
      entityId: id,
      description: "Status editorial alterado para publicado.",
      metadata: {
        status: post.status,
      },
      ipAddress,
      userAgent,
    });

    return ok({ post });
  } catch (error) {
    return asRateLimitResponse(error) ?? fromUnknownError(error);
  }
}
