import { NewsAuditAction } from "@prisma/client";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fromUnknownError } from "@/lib/news/api";
import { writeAuditLog } from "@/lib/news/audit";
import { clearSessionCookies, requireApiAdmin, revokeSessionByToken } from "@/lib/news/auth";
import { NEWS_SESSION_COOKIE, RATE_LIMIT_WINDOWS } from "@/lib/news/constants";
import { asRateLimitResponse, getRequestIp, getUserAgent, requireRateLimit } from "@/lib/news/http";

export async function POST(request: NextRequest) {
  const ipAddress = getRequestIp(request);
  const userAgent = getUserAgent(request);

  try {
    requireRateLimit(`admin-api:${ipAddress}`, RATE_LIMIT_WINDOWS.adminApi);

    const session = await requireApiAdmin(request, {
      requireCsrf: true,
    });

    const rawToken = request.cookies.get(NEWS_SESSION_COOKIE)?.value;
    await revokeSessionByToken(rawToken);

    const response = NextResponse.json({
      success: true,
      data: {
        loggedOut: true,
      },
    });
    clearSessionCookies(response);

    await writeAuditLog({
      action: NewsAuditAction.LOGOUT,
      actorId: session.id,
      entityType: "auth",
      entityId: session.sessionId,
      description: "Logout administrativo realizado.",
      ipAddress,
      userAgent,
    });

    return response;
  } catch (error) {
    return asRateLimitResponse(error) ?? fromUnknownError(error);
  }
}
