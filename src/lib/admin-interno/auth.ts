import { InternalAdminRoleKey } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest, NextResponse } from "next/server";
import { InternalApiError } from "@/lib/admin-interno/api";
import {
  INTERNAL_ADMIN_CSRF_COOKIE,
  INTERNAL_ADMIN_SESSION_COOKIE,
  INTERNAL_AUTH_COOKIE_PATH,
  INTERNAL_LOGIN_IP_MAX_ATTEMPTS,
  INTERNAL_LOGIN_LOCK_MINUTES,
  INTERNAL_LOGIN_USER_MAX_ATTEMPTS,
  INTERNAL_LOGIN_WINDOW_MINUTES,
  INTERNAL_SESSION_IDLE_TIMEOUT_MINUTES,
  INTERNAL_SESSION_TTL_HOURS,
} from "@/lib/admin-interno/constants";
import { getRequestIp, getUserAgent, requireTrustedOrigin } from "@/lib/admin-interno/http";
import { hasPermission, type InternalPermission } from "@/lib/admin-interno/permissions";
import { maskIpAddress, sanitizeEmail } from "@/lib/admin-interno/sanitize";
import { generateOpaqueToken, hashPassword, safeEqual, sha256, verifyPassword } from "@/lib/admin-interno/security";
import { writeAuditLog } from "@/lib/admin-interno/audit";
import { prisma } from "@/lib/db/prisma";

const SESSION_REFRESH_MS = 60_000;

type SessionPayload = {
  sessionId: string;
  userId: string;
  email: string;
  fullName: string;
  role: InternalAdminRoleKey;
  csrfTokenHash: string;
};

export type AuthenticatedInternalAdmin = {
  sessionId: string;
  userId: string;
  email: string;
  fullName: string;
  role: InternalAdminRoleKey;
};

function getSessionDurationMs() {
  return INTERNAL_SESSION_TTL_HOURS * 60 * 60 * 1000;
}

function getIdleTimeoutMs() {
  return INTERNAL_SESSION_IDLE_TIMEOUT_MINUTES * 60 * 1000;
}

function isSessionExpired(expiresAt: Date, lastSeenAt: Date) {
  const now = Date.now();
  if (expiresAt.getTime() <= now) {
    return true;
  }

  return now - lastSeenAt.getTime() > getIdleTimeoutMs();
}

function toAuthenticated(payload: SessionPayload): AuthenticatedInternalAdmin {
  return {
    sessionId: payload.sessionId,
    userId: payload.userId,
    email: payload.email,
    fullName: payload.fullName,
    role: payload.role,
  };
}

function getCookieSecurity() {
  return process.env.NODE_ENV === "production";
}

async function findValidSessionByToken(
  sessionToken: string | null | undefined,
  expectedUserAgentHash?: string | null,
): Promise<SessionPayload | null> {
  if (!sessionToken) {
    return null;
  }

  const session = await prisma.internalAdminSession.findUnique({
    where: {
      sessionTokenHash: sha256(sessionToken),
    },
    include: {
      user: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (session.revokedAt) {
    return null;
  }

  const isLocked =
    session.user.lockedUntil != null && session.user.lockedUntil.getTime() > Date.now();

  if (!session.user.isActive || session.user.deletedAt || isLocked) {
    await prisma.internalAdminSession.updateMany({
      where: {
        id: session.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokedReason: "inactive_user",
      },
    });
    return null;
  }

  if (isSessionExpired(session.expiresAt, session.lastSeenAt)) {
    await prisma.internalAdminSession.updateMany({
      where: {
        id: session.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokedReason: "expired",
      },
    });
    return null;
  }

  if (expectedUserAgentHash && session.userAgentHash && !safeEqual(expectedUserAgentHash, session.userAgentHash)) {
    await prisma.internalAdminSession.updateMany({
      where: {
        id: session.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokedReason: "user_agent_changed",
      },
    });

    return null;
  }

  if (Date.now() - session.lastSeenAt.getTime() > SESSION_REFRESH_MS) {
    await prisma.internalAdminSession.update({
      where: {
        id: session.id,
      },
      data: {
        lastSeenAt: new Date(),
      },
    });
  }

  return {
    sessionId: session.id,
    userId: session.user.id,
    email: session.user.email,
    fullName: session.user.fullName,
    role: session.user.role.key,
    csrfTokenHash: session.csrfTokenHash,
  };
}

export async function createInternalAdminSession(
  userId: string,
  context?: {
    ipMasked?: string | null;
    userAgent?: string | null;
    rotateExisting?: boolean;
    rotatedFromSessionId?: string | null;
  },
) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + getSessionDurationMs());
  const sessionToken = generateOpaqueToken(48);
  const csrfToken = generateOpaqueToken(32);

  if (context?.rotateExisting !== false) {
    await prisma.internalAdminSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: now,
        revokedReason: "login_rotation",
      },
    });
  }

  const session = await prisma.internalAdminSession.create({
    data: {
      sessionTokenHash: sha256(sessionToken),
      csrfTokenHash: sha256(csrfToken),
      userId,
      ipMasked: context?.ipMasked ?? null,
      userAgentHash: context?.userAgent ? sha256(context.userAgent) : null,
      expiresAt,
      rotatedFromSessionId: context?.rotatedFromSessionId ?? null,
    },
  });

  return {
    sessionId: session.id,
    sessionToken,
    csrfToken,
    expiresAt,
  };
}

export function applyInternalSessionCookies(
  response: NextResponse,
  payload: {
    sessionToken: string;
    csrfToken: string;
    expiresAt: Date;
  },
) {
  const secure = getCookieSecurity();

  response.cookies.set({
    name: INTERNAL_ADMIN_SESSION_COOKIE,
    value: payload.sessionToken,
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: INTERNAL_AUTH_COOKIE_PATH,
    expires: payload.expiresAt,
  });

  response.cookies.set({
    name: INTERNAL_ADMIN_CSRF_COOKIE,
    value: payload.csrfToken,
    httpOnly: false,
    secure,
    sameSite: "strict",
    path: INTERNAL_AUTH_COOKIE_PATH,
    expires: payload.expiresAt,
  });
}

export function clearInternalSessionCookies(response: NextResponse) {
  const secure = getCookieSecurity();

  response.cookies.set({
    name: INTERNAL_ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: INTERNAL_AUTH_COOKIE_PATH,
    expires: new Date(0),
  });

  response.cookies.set({
    name: INTERNAL_ADMIN_CSRF_COOKIE,
    value: "",
    httpOnly: false,
    secure,
    sameSite: "strict",
    path: INTERNAL_AUTH_COOKIE_PATH,
    expires: new Date(0),
  });
}

export async function revokeInternalSessionByToken(
  sessionToken: string | null | undefined,
  reason = "manual_logout",
) {
  if (!sessionToken) {
    return;
  }

  await prisma.internalAdminSession.updateMany({
    where: {
      sessionTokenHash: sha256(sessionToken),
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
      revokedReason: reason,
    },
  });
}

export async function getInternalAuthFromRequest(request: NextRequest) {
  const sessionToken = request.cookies.get(INTERNAL_ADMIN_SESSION_COOKIE)?.value;
  const userAgent = getUserAgent(request);
  const payload = await findValidSessionByToken(sessionToken, userAgent ? sha256(userAgent) : null);
  if (!payload) {
    return null;
  }

  return {
    ...toAuthenticated(payload),
    csrfTokenHash: payload.csrfTokenHash,
  };
}

export async function getInternalAuthFromServer() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(INTERNAL_ADMIN_SESSION_COOKIE)?.value;
  const payload = await findValidSessionByToken(sessionToken);
  if (!payload) {
    return null;
  }

  return toAuthenticated(payload);
}

export async function requireInternalPageSession(permission?: InternalPermission) {
  const session = await getInternalAuthFromServer();
  if (!session) {
    redirect("/admin-interno/login");
  }

  if (permission && !hasPermission(session.role, permission)) {
    redirect("/admin-interno/login?error=forbidden");
  }

  return session;
}

export function assertInternalCsrf(
  request: NextRequest,
  session: {
    csrfTokenHash: string;
  },
) {
  requireTrustedOrigin(request);

  const headerToken = request.headers.get("x-admin-csrf-token");
  const cookieToken = request.cookies.get(INTERNAL_ADMIN_CSRF_COOKIE)?.value;

  if (!headerToken || !cookieToken) {
    throw new InternalApiError(403, "CSRF_REQUIRED", "Token CSRF obrigatorio.");
  }

  if (!safeEqual(headerToken, cookieToken)) {
    throw new InternalApiError(403, "CSRF_INVALID", "Token CSRF inválido.");
  }

  if (!safeEqual(sha256(headerToken), session.csrfTokenHash)) {
    throw new InternalApiError(403, "CSRF_INVALID", "Token CSRF inválido.");
  }
}

export async function requireInternalApiSession(
  request: NextRequest,
  options?: {
    permission?: InternalPermission;
    requireCsrf?: boolean;
  },
) {
  const session = await getInternalAuthFromRequest(request);
  if (!session) {
    throw new InternalApiError(401, "UNAUTHENTICATED", "Autenticação obrigatória.");
  }

  if (options?.permission && !hasPermission(session.role, options.permission)) {
    throw new InternalApiError(403, "FORBIDDEN", "Permissão insuficiente.");
  }

  if (options?.requireCsrf) {
    assertInternalCsrf(request, session);
  }

  return session;
}

export async function authenticateInternalUser(email: string, password: string) {
  const normalizedEmail = sanitizeEmail(email);

  const user = await prisma.internalAdminUser.findUnique({
    where: {
      email: normalizedEmail,
    },
    include: {
      role: true,
    },
  });

  if (!user || !user.isActive || user.deletedAt) {
    return null;
  }

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    throw new InternalApiError(423, "ACCOUNT_LOCKED", "Conta temporariamente bloqueada.");
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  return user;
}

export async function registerInternalLoginFailure(input: {
  email: string;
  userId?: string | null;
  ipMasked: string;
  reason: string;
}) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - INTERNAL_LOGIN_WINDOW_MINUTES * 60_000);

  await prisma.$transaction(async (tx) => {
    await tx.internalLoginAttempt.create({
      data: {
        email: sanitizeEmail(input.email) || null,
        userId: input.userId ?? null,
        ipMasked: input.ipMasked,
        success: false,
        reason: input.reason,
      },
    });

    if (input.userId) {
      const current = await tx.internalAdminUser.findUnique({
        where: {
          id: input.userId,
        },
        select: {
          failedLoginCount: true,
        },
      });

      if (current) {
        const nextCount = current.failedLoginCount + 1;
        await tx.internalAdminUser.update({
          where: {
            id: input.userId,
          },
          data: {
            failedLoginCount: nextCount,
            lockedUntil:
              nextCount >= INTERNAL_LOGIN_USER_MAX_ATTEMPTS
                ? new Date(now.getTime() + INTERNAL_LOGIN_LOCK_MINUTES * 60_000)
                : null,
          },
        });
      }
    }

    const ipLock = await tx.internalIpLock.findUnique({
      where: {
        ipMasked: input.ipMasked,
      },
    });

    const isWithinWindow = ipLock?.lastAttemptAt && ipLock.lastAttemptAt >= windowStart;
    const nextIpCount = isWithinWindow ? (ipLock?.failedCount ?? 0) + 1 : 1;

    if (!ipLock) {
      await tx.internalIpLock.create({
        data: {
          ipMasked: input.ipMasked,
          failedCount: 1,
          lastAttemptAt: now,
          lockedUntil:
            INTERNAL_LOGIN_IP_MAX_ATTEMPTS <= 1
              ? new Date(now.getTime() + INTERNAL_LOGIN_LOCK_MINUTES * 60_000)
              : null,
        },
      });
    } else {
      await tx.internalIpLock.update({
        where: {
          id: ipLock.id,
        },
        data: {
          failedCount: nextIpCount,
          lastAttemptAt: now,
          lockedUntil:
            nextIpCount >= INTERNAL_LOGIN_IP_MAX_ATTEMPTS
              ? new Date(now.getTime() + INTERNAL_LOGIN_LOCK_MINUTES * 60_000)
              : null,
        },
      });
    }
  });
}

export async function registerInternalLoginSuccess(input: {
  userId: string;
  email: string;
  ipMasked: string;
}) {
  await prisma.$transaction(async (tx) => {
    await tx.internalLoginAttempt.create({
      data: {
        email: sanitizeEmail(input.email) || null,
        userId: input.userId,
        ipMasked: input.ipMasked,
        success: true,
        reason: "success",
      },
    });

    await tx.internalAdminUser.update({
      where: {
        id: input.userId,
      },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    await tx.internalIpLock.upsert({
      where: {
        ipMasked: input.ipMasked,
      },
      update: {
        failedCount: 0,
        lockedUntil: null,
        lastAttemptAt: new Date(),
      },
      create: {
        ipMasked: input.ipMasked,
        failedCount: 0,
        lockedUntil: null,
        lastAttemptAt: new Date(),
      },
    });
  });
}

export async function assertInternalLoginAllowed(input: {
  email: string;
  ipMasked: string;
}) {
  const now = Date.now();

  const ipLock = await prisma.internalIpLock.findUnique({
    where: {
      ipMasked: input.ipMasked,
    },
  });

  if (ipLock?.lockedUntil && ipLock.lockedUntil.getTime() > now) {
    await writeAuditLog({
      actorId: null,
      action: "SECURITY_LOCKOUT",
      entityType: "auth_ip",
      entityId: ipLock.id,
      ipMasked: input.ipMasked,
      context: {
        email: sanitizeEmail(input.email),
        lockedUntil: ipLock.lockedUntil.toISOString(),
      },
    });
    throw new InternalApiError(429, "IP_TEMPORARILY_LOCKED", "Muitas tentativas. Aguarde alguns minutos.");
  }

  const user = await prisma.internalAdminUser.findUnique({
    where: {
      email: sanitizeEmail(input.email),
    },
    select: {
      id: true,
      lockedUntil: true,
    },
  });

  if (user?.lockedUntil && user.lockedUntil.getTime() > now) {
    await writeAuditLog({
      actorId: user.id,
      action: "SECURITY_LOCKOUT",
      entityType: "auth_user",
      entityId: user.id,
      ipMasked: input.ipMasked,
      context: {
        email: sanitizeEmail(input.email),
        lockedUntil: user.lockedUntil.toISOString(),
      },
    });
    throw new InternalApiError(423, "ACCOUNT_LOCKED", "Conta temporariamente bloqueada.");
  }
}

export async function updateInternalAdminPassword(userId: string, plainPassword: string) {
  const nextHash = await hashPassword(plainPassword);
  await prisma.internalAdminUser.update({
    where: {
      id: userId,
    },
    data: {
      passwordHash: nextHash,
      lastPasswordChangeAt: new Date(),
      failedLoginCount: 0,
      lockedUntil: null,
    },
  });
}

export async function logSessionRevocation(
  actorId: string | null,
  sessionId: string,
  request: NextRequest,
) {
  await writeAuditLog({
    actorId,
    action: "SESSION_REVOKED",
    entityType: "session",
    entityId: sessionId,
    ipMasked: maskIpAddress(getRequestIp(request)),
    userAgent: getUserAgent(request).slice(0, 500),
  });
}
