import { NewsAuditAction } from "@prisma/client";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ApiError, fromUnknownError, parseJsonBody } from "@/lib/news/api";
import { writeAuditLog } from "@/lib/news/audit";
import { applySessionCookies, createSessionForUser, verifyPassword } from "@/lib/news/auth";
import { RATE_LIMIT_WINDOWS } from "@/lib/news/constants";
import { asRateLimitResponse, getRequestIp, getUserAgent, requireRateLimit } from "@/lib/news/http";
import { loginSchema } from "@/lib/news/validators";

export async function POST(request: NextRequest) {
  const ipAddress = getRequestIp(request);
  const userAgent = getUserAgent(request);

  try {
    requireRateLimit(`login:${ipAddress}`, RATE_LIMIT_WINDOWS.login);

    const body = loginSchema.parse(await parseJsonBody(request, 20_000));

    const user = await prisma.user.findUnique({
      where: {
        email: body.email.toLowerCase(),
      },
      include: {
        role: true,
      },
    });

    if (!user || !user.isActive || !verifyPassword(body.password, user.passwordHash)) {
      await writeAuditLog({
        action: NewsAuditAction.LOGIN_FAILED,
        actorId: user?.id ?? null,
        entityType: "auth",
        entityId: null,
        description: "Falha de autenticação no painel de notícias.",
        metadata: {
          email: body.email,
        },
        ipAddress,
        userAgent,
      });

      throw new ApiError(401, "INVALID_CREDENTIALS", "Credenciais inválidas.");
    }

    const sessionPayload = await createSessionForUser(user.id, {
      ipAddress,
      userAgent,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role.key,
        },
        csrfToken: sessionPayload.csrfToken,
      },
    });

    applySessionCookies(response, {
      sessionToken: sessionPayload.sessionToken,
      csrfToken: sessionPayload.csrfToken,
      expiresAt: sessionPayload.expiresAt,
    });

    await writeAuditLog({
      action: NewsAuditAction.LOGIN,
      actorId: user.id,
      entityType: "auth",
      entityId: sessionPayload.sessionId,
      description: "Login administrativo realizado.",
      ipAddress,
      userAgent,
    });

    return response;
  } catch (error) {
    return asRateLimitResponse(error) ?? fromUnknownError(error);
  }
}
