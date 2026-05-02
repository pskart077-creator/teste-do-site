import { NewsAuditAction, UserRole } from "@prisma/client";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ApiError, fromUnknownError, ok, parseJsonBody } from "@/lib/news/api";
import { writeAuditLog } from "@/lib/news/audit";
import { requireApiAdmin } from "@/lib/news/auth";
import { RATE_LIMIT_WINDOWS } from "@/lib/news/constants";
import { asRateLimitResponse, getRequestIp, getUserAgent, requireRateLimit } from "@/lib/news/http";
import { deleteNewsTag, updateNewsTag } from "@/lib/news/queries";
import { tagUpdateSchema } from "@/lib/news/validators";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    requireRateLimit(`admin-api:${getRequestIp(request)}`, RATE_LIMIT_WINDOWS.adminApi);
    await requireApiAdmin(request);

    const { id } = await context.params;
    const tag = await prisma.newsTag.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    if (!tag) {
      throw new ApiError(404, "TAG_NOT_FOUND", "Tag não encontrada.");
    }

    return ok({
      tag: {
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        postCount: tag._count.posts,
      },
    });
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
      allowedRoles: [UserRole.SUPER_ADMIN, UserRole.EDITOR],
      requireCsrf: true,
    });

    const { id } = await context.params;
    const body = tagUpdateSchema.parse(await parseJsonBody(request, 50_000));
    const tag = await updateNewsTag(id, body, session.role);

    await writeAuditLog({
      action: NewsAuditAction.TAG_UPDATE,
      actorId: session.id,
      entityType: "news_tag",
      entityId: tag.id,
      description: "Tag atualizada no painel de notícias.",
      ipAddress,
      userAgent,
    });

    return ok({ tag });
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
    await deleteNewsTag(id, session.role);

    await writeAuditLog({
      action: NewsAuditAction.TAG_DELETE,
      actorId: session.id,
      entityType: "news_tag",
      entityId: id,
      description: "Tag removida no painel de notícias.",
      ipAddress,
      userAgent,
    });

    return ok({ deleted: true });
  } catch (error) {
    return asRateLimitResponse(error) ?? fromUnknownError(error);
  }
}
