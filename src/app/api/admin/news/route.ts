import { NewsAuditAction, UserRole } from "@prisma/client";
import type { NextRequest } from "next/server";
import { fromUnknownError, ok, parseJsonBody } from "@/lib/news/api";
import { writeAuditLog } from "@/lib/news/audit";
import { requireApiAdmin } from "@/lib/news/auth";
import { RATE_LIMIT_WINDOWS } from "@/lib/news/constants";
import { asRateLimitResponse, getRequestIp, getUserAgent, requireRateLimit } from "@/lib/news/http";
import { createNewsPost, listAdminNews } from "@/lib/news/queries";
import { adminNewsQuerySchema, createNewsPostSchema } from "@/lib/news/validators";

export async function GET(request: NextRequest) {
  try {
    requireRateLimit(`admin-api:${getRequestIp(request)}`, RATE_LIMIT_WINDOWS.adminApi);
    await requireApiAdmin(request);

    const query = adminNewsQuerySchema.parse({
      page: request.nextUrl.searchParams.get("page") ?? undefined,
      pageSize: request.nextUrl.searchParams.get("pageSize") ?? undefined,
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      status: request.nextUrl.searchParams.get("status") ?? undefined,
      categoryId: request.nextUrl.searchParams.get("categoryId") ?? undefined,
      tagId: request.nextUrl.searchParams.get("tagId") ?? undefined,
      orderBy: request.nextUrl.searchParams.get("orderBy") ?? undefined,
    });

    const result = await listAdminNews({
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
      status: query.status,
      categoryId: query.categoryId,
      tagId: query.tagId,
      orderBy: query.orderBy,
    });

    return ok(result);
  } catch (error) {
    return asRateLimitResponse(error) ?? fromUnknownError(error);
  }
}

export async function POST(request: NextRequest) {
  const ipAddress = getRequestIp(request);
  const userAgent = getUserAgent(request);

  try {
    requireRateLimit(`admin-api:${ipAddress}`, RATE_LIMIT_WINDOWS.adminApi);

    const session = await requireApiAdmin(request, {
      allowedRoles: [UserRole.SUPER_ADMIN, UserRole.EDITOR, UserRole.AUTHOR],
      requireCsrf: true,
    });

    const body = createNewsPostSchema.parse(await parseJsonBody(request));
    const post = await createNewsPost(body, session);

    await writeAuditLog({
      action: NewsAuditAction.CREATE,
      actorId: session.id,
      entityType: "news_post",
      entityId: post?.id,
      description: "Notícia criada no painel de notícias.",
      metadata: {
        status: post?.status,
      },
      ipAddress,
      userAgent,
    });

    return ok({ post }, { status: 201 });
  } catch (error) {
    return asRateLimitResponse(error) ?? fromUnknownError(error);
  }
}
