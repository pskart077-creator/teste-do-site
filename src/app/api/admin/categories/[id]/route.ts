import { NewsAuditAction, UserRole } from "@prisma/client";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ApiError, fromUnknownError, ok, parseJsonBody } from "@/lib/news/api";
import { writeAuditLog } from "@/lib/news/audit";
import { requireApiAdmin } from "@/lib/news/auth";
import { RATE_LIMIT_WINDOWS } from "@/lib/news/constants";
import { asRateLimitResponse, getRequestIp, getUserAgent, requireRateLimit } from "@/lib/news/http";
import { deleteNewsCategory, updateNewsCategory } from "@/lib/news/queries";
import { categoryUpdateSchema } from "@/lib/news/validators";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    requireRateLimit(`admin-api:${getRequestIp(request)}`, RATE_LIMIT_WINDOWS.adminApi);
    await requireApiAdmin(request);

    const { id } = await context.params;
    const category = await prisma.newsCategory.findFirst({
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

    if (!category) {
      throw new ApiError(404, "CATEGORY_NOT_FOUND", "Categoria não encontrada.");
    }

    return ok({
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        color: category.color,
        allowIndexing: category.allowIndexing,
        postCount: category._count.posts,
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
    const body = categoryUpdateSchema.parse(await parseJsonBody(request, 50_000));
    const category = await updateNewsCategory(id, body, session.role);

    await writeAuditLog({
      action: NewsAuditAction.CATEGORY_UPDATE,
      actorId: session.id,
      entityType: "news_category",
      entityId: category.id,
      description: "Categoria atualizada no painel de notícias.",
      ipAddress,
      userAgent,
    });

    return ok({ category });
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
    await deleteNewsCategory(id, session.role);

    await writeAuditLog({
      action: NewsAuditAction.CATEGORY_DELETE,
      actorId: session.id,
      entityType: "news_category",
      entityId: id,
      description: "Categoria removida no painel de notícias.",
      ipAddress,
      userAgent,
    });

    return ok({ deleted: true });
  } catch (error) {
    return asRateLimitResponse(error) ?? fromUnknownError(error);
  }
}
