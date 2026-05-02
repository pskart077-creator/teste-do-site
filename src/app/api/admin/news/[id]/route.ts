import { NewsAuditAction, UserRole } from "@prisma/client";
import type { NextRequest } from "next/server";
import { ApiError, fromUnknownError, ok, parseJsonBody } from "@/lib/news/api";
import { writeAuditLog } from "@/lib/news/audit";
import { requireApiAdmin } from "@/lib/news/auth";
import { RATE_LIMIT_WINDOWS } from "@/lib/news/constants";
import { asRateLimitResponse, getRequestIp, getUserAgent, requireRateLimit } from "@/lib/news/http";
import { deleteNewsPost, getAdminNewsById, updateNewsPost } from "@/lib/news/queries";
import { updateNewsPostSchema } from "@/lib/news/validators";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    requireRateLimit(`admin-api:${getRequestIp(request)}`, RATE_LIMIT_WINDOWS.adminApi);
    await requireApiAdmin(request);

    const { id } = await context.params;
    const post = await getAdminNewsById(id);

    if (!post) {
      throw new ApiError(404, "NEWS_NOT_FOUND", "Notícia não encontrada.");
    }

    return ok({ post });
  } catch (error) {
    return asRateLimitResponse(error) ?? fromUnknownError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const ipAddress = getRequestIp(request);
  const userAgent = getUserAgent(request);

  try {
    requireRateLimit(`admin-api:${ipAddress}`, RATE_LIMIT_WINDOWS.adminApi);

    const session = await requireApiAdmin(request, {
      allowedRoles: [UserRole.SUPER_ADMIN, UserRole.EDITOR, UserRole.AUTHOR],
      requireCsrf: true,
    });

    const { id } = await context.params;
    const payload = updateNewsPostSchema.parse(await parseJsonBody(request));
    const updated = await updateNewsPost(id, payload, session);

    await writeAuditLog({
      action: NewsAuditAction.UPDATE,
      actorId: session.id,
      entityType: "news_post",
      entityId: id,
      description: "Notícia atualizada no painel de notícias.",
      metadata: {
        status: updated?.status,
      },
      ipAddress,
      userAgent,
    });

    return ok({ post: updated });
  } catch (error) {
    return asRateLimitResponse(error) ?? fromUnknownError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const ipAddress = getRequestIp(request);
  const userAgent = getUserAgent(request);

  try {
    requireRateLimit(`admin-api:${ipAddress}`, RATE_LIMIT_WINDOWS.adminApi);

    const session = await requireApiAdmin(request, {
      allowedRoles: [UserRole.SUPER_ADMIN, UserRole.EDITOR],
      requireCsrf: true,
    });

    const { id } = await context.params;
    await deleteNewsPost(id, session);

    await writeAuditLog({
      action: NewsAuditAction.DELETE,
      actorId: session.id,
      entityType: "news_post",
      entityId: id,
      description: "Notícia removida no painel de notícias.",
      ipAddress,
      userAgent,
    });

    return ok({ deleted: true });
  } catch (error) {
    return asRateLimitResponse(error) ?? fromUnknownError(error);
  }
}
