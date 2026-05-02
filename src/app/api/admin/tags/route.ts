import { NewsAuditAction, UserRole } from "@prisma/client";
import type { NextRequest } from "next/server";
import { fromUnknownError, ok, parseJsonBody } from "@/lib/news/api";
import { writeAuditLog } from "@/lib/news/audit";
import { requireApiAdmin } from "@/lib/news/auth";
import { RATE_LIMIT_WINDOWS } from "@/lib/news/constants";
import { asRateLimitResponse, getRequestIp, getUserAgent, requireRateLimit } from "@/lib/news/http";
import { createNewsTag, listNewsTags } from "@/lib/news/queries";
import { tagCreateSchema } from "@/lib/news/validators";

export async function GET(request: NextRequest) {
  try {
    requireRateLimit(`admin-api:${getRequestIp(request)}`, RATE_LIMIT_WINDOWS.adminApi);
    await requireApiAdmin(request);

    const tags = await listNewsTags();
    return ok({ tags });
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
      allowedRoles: [UserRole.SUPER_ADMIN, UserRole.EDITOR],
      requireCsrf: true,
    });

    const body = tagCreateSchema.parse(await parseJsonBody(request, 50_000));
    const tag = await createNewsTag(body, session.role);

    await writeAuditLog({
      action: NewsAuditAction.TAG_CREATE,
      actorId: session.id,
      entityType: "news_tag",
      entityId: tag.id,
      description: "Tag criada no painel de notícias.",
      metadata: {
        slug: tag.slug,
      },
      ipAddress,
      userAgent,
    });

    return ok({ tag }, { status: 201 });
  } catch (error) {
    return asRateLimitResponse(error) ?? fromUnknownError(error);
  }
}
