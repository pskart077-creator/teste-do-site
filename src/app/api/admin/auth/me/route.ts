import type { NextRequest } from "next/server";
import { fromUnknownError, ok } from "@/lib/news/api";
import { requireApiAdmin } from "@/lib/news/auth";
import { RATE_LIMIT_WINDOWS } from "@/lib/news/constants";
import { asRateLimitResponse, getRequestIp, requireRateLimit } from "@/lib/news/http";

export async function GET(request: NextRequest) {
  try {
    requireRateLimit(`admin-api:${getRequestIp(request)}`, RATE_LIMIT_WINDOWS.adminApi);

    const session = await requireApiAdmin(request);
    return ok({
      user: {
        id: session.id,
        email: session.email,
        displayName: session.displayName,
        role: session.role,
      },
      csrfToken: session.csrfToken,
    });
  } catch (error) {
    return asRateLimitResponse(error) ?? fromUnknownError(error);
  }
}
