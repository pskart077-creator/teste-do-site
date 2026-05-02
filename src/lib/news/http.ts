import type { NextRequest } from "next/server";
import { ApiError, fail } from "@/lib/news/api";
import { checkRateLimit } from "@/lib/news/rate-limit";

export function getRequestIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  const realIp = request.headers.get("x-real-ip");
  return realIp?.trim() ?? "unknown";
}

export function getUserAgent(request: NextRequest) {
  return request.headers.get("user-agent") ?? "unknown";
}

export function requireRateLimit(
  key: string,
  config: {
    limit: number;
    windowMs: number;
  },
) {
  const result = checkRateLimit(key, config.limit, config.windowMs);
  if (!result.allowed) {
    throw new ApiError(429, "RATE_LIMITED", "Muitas requisicoes. Tente novamente em instantes.", {
      resetAt: result.resetAt,
    });
  }

  return result;
}

export function asRateLimitResponse(error: unknown) {
  if (error instanceof ApiError && error.status === 429) {
    return fail(429, error.code, error.message, error.details, {
      headers: {
        "Retry-After": "60",
      },
    });
  }

  return null;
}
