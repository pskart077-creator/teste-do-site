import { randomBytes, scryptSync } from "node:crypto";
import type { UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/news/api";
import { NEWS_CSRF_COOKIE, NEWS_SESSION_COOKIE, NEWS_SESSION_TTL_HOURS } from "@/lib/news/constants";
import { safeEqual, sha256 } from "@/lib/news/helpers";
import { canAccessAdmin } from "@/lib/news/permissions";
import type { AuthenticatedAdmin } from "@/lib/news/types";

const SESSION_COOKIE_PATH = "/";

function getSessionDurationMs() {
  return NEWS_SESSION_TTL_HOURS * 60 * 60 * 1000;
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `s1$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [version, salt, hash] = storedHash.split("$");
  if (version !== "s1" || !salt || !hash) {
    return false;
  }

  const candidate = scryptSync(password, salt, 64).toString("hex");
  return safeEqual(candidate, hash);
}

function calculateExpiryDate() {
  return new Date(Date.now() + getSessionDurationMs());
}

function buildAuthResult(session: {
  id: string;
  csrfToken: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    role: {
      key: UserRole;
    };
  };
}): AuthenticatedAdmin {
  return {
    id: session.user.id,
    email: session.user.email,
    displayName: session.user.displayName,
    role: session.user.role.key,
    sessionId: session.id,
    csrfToken: session.csrfToken,
  };
}

export async function createSessionForUser(
  userId: string,
  context?: {
    ipAddress?: string | null;
    userAgent?: string | null;
  },
) {
  const sessionToken = randomBytes(48).toString("base64url");
  const csrfToken = randomBytes(32).toString("base64url");
  const expiresAt = calculateExpiryDate();

  const session = await prisma.adminSession.create({
    data: {
      tokenHash: sha256(sessionToken),
      csrfToken,
      userId,
      ipAddress: context?.ipAddress ?? null,
      userAgent: context?.userAgent ?? null,
      expiresAt,
    },
  });

  return {
    sessionToken,
    csrfToken,
    expiresAt,
    sessionId: session.id,
  };
}

export function applySessionCookies(
  response: NextResponse,
  payload: {
    sessionToken: string;
    csrfToken: string;
    expiresAt: Date;
  },
) {
  const secure = process.env.NODE_ENV === "production";

  response.cookies.set({
    name: NEWS_SESSION_COOKIE,
    value: payload.sessionToken,
    httpOnly: true,
    sameSite: "strict",
    secure,
    path: SESSION_COOKIE_PATH,
    expires: payload.expiresAt,
  });

  response.cookies.set({
    name: NEWS_CSRF_COOKIE,
    value: payload.csrfToken,
    httpOnly: false,
    sameSite: "strict",
    secure,
    path: SESSION_COOKIE_PATH,
    expires: payload.expiresAt,
  });
}

export function clearSessionCookies(response: NextResponse) {
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set({
    name: NEWS_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "strict",
    secure,
    path: SESSION_COOKIE_PATH,
    expires: new Date(0),
  });
  response.cookies.set({
    name: NEWS_CSRF_COOKIE,
    value: "",
    httpOnly: false,
    sameSite: "strict",
    secure,
    path: SESSION_COOKIE_PATH,
    expires: new Date(0),
  });
}

async function findValidSession(token: string | undefined | null) {
  if (!token) {
    return null;
  }

  const tokenHash = sha256(token);
  const session = await prisma.adminSession.findUnique({
    where: {
      tokenHash,
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

  if (session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  if (!session.user.isActive || !canAccessAdmin(session.user.role.key)) {
    return null;
  }

  if (Date.now() - session.lastSeenAt.getTime() > 60_000) {
    await prisma.adminSession.update({
      where: {
        id: session.id,
      },
      data: {
        lastSeenAt: new Date(),
      },
    });
  }

  return session;
}

export async function revokeSessionByToken(token: string | null | undefined) {
  if (!token) {
    return;
  }

  await prisma.adminSession.updateMany({
    where: {
      tokenHash: sha256(token),
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

export async function getAuthSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get(NEWS_SESSION_COOKIE)?.value;
  const session = await findValidSession(token);
  if (!session) {
    return null;
  }

  return buildAuthResult(session);
}

export async function getAuthSessionFromServer() {
  const store = await cookies();
  const token = store.get(NEWS_SESSION_COOKIE)?.value;
  const session = await findValidSession(token);
  if (!session) {
    return null;
  }

  return buildAuthResult(session);
}

export async function requireServerAdmin(allowedRoles?: UserRole[]) {
  const session = await getAuthSessionFromServer();
  if (!session) {
    redirect("/admin/login");
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    redirect("/admin/login?error=forbidden");
  }

  return session;
}

export function assertCsrf(request: NextRequest, session: AuthenticatedAdmin) {
  const csrfHeader = request.headers.get("x-csrf-token");
  const csrfCookie = request.cookies.get(NEWS_CSRF_COOKIE)?.value;

  if (!csrfHeader || !csrfCookie) {
    throw new ApiError(403, "CSRF_REQUIRED", "Token CSRF ausente.");
  }

  if (!safeEqual(csrfHeader, csrfCookie) || !safeEqual(csrfHeader, session.csrfToken)) {
    throw new ApiError(403, "CSRF_INVALID", "Token CSRF inválido.");
  }
}

export async function requireApiAdmin(
  request: NextRequest,
  options?: {
    allowedRoles?: UserRole[];
    requireCsrf?: boolean;
  },
) {
  const session = await getAuthSessionFromRequest(request);
  if (!session) {
    throw new ApiError(401, "UNAUTHENTICATED", "Autenticação obrigatória.");
  }

  if (options?.allowedRoles && !options.allowedRoles.includes(session.role)) {
    throw new ApiError(403, "FORBIDDEN", "Sem permissão para esta operação.");
  }

  if (options?.requireCsrf) {
    assertCsrf(request, session);
  }

  return session;
}
