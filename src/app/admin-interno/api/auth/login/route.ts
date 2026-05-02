import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fromUnknownError, InternalApiError, parseJsonBody } from "@/lib/admin-interno/api";
import {
  applyInternalSessionCookies,
  assertInternalLoginAllowed,
  authenticateInternalUser,
  createInternalAdminSession,
  registerInternalLoginFailure,
  registerInternalLoginSuccess,
} from "@/lib/admin-interno/auth";
import { getRequestIp, getUserAgent } from "@/lib/admin-interno/http";
import { maskIpAddress, sanitizeEmail } from "@/lib/admin-interno/sanitize";
import { writeAuditLog } from "@/lib/admin-interno/audit";
import { loginSchema } from "@/lib/admin-interno/validators";

export async function POST(request: NextRequest) {
  const ipMasked = maskIpAddress(getRequestIp(request));
  const userAgent = getUserAgent(request).slice(0, 500);

  try {
    const body = loginSchema.parse(await parseJsonBody(request, 20_000));
    const normalizedEmail = sanitizeEmail(body.email);

    await assertInternalLoginAllowed({
      email: normalizedEmail,
      ipMasked,
    });

    const user = await authenticateInternalUser(normalizedEmail, body.password);
    if (!user) {
      await registerInternalLoginFailure({
        email: normalizedEmail,
        userId: null,
        ipMasked,
        reason: "invalid_credentials",
      });

      await writeAuditLog({
        actorId: null,
        action: "LOGIN_FAILED",
        entityType: "auth",
        ipMasked,
        userAgent,
        context: {
          email: normalizedEmail,
          reason: "invalid_credentials",
        },
      });

      throw new InternalApiError(401, "INVALID_CREDENTIALS", "Credenciais inválidas.");
    }

    await registerInternalLoginSuccess({
      userId: user.id,
      email: user.email,
      ipMasked,
    });

    const session = await createInternalAdminSession(user.id, {
      ipMasked,
      userAgent,
      rotateExisting: true,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role.key,
        },
      },
    });

    applyInternalSessionCookies(response, {
      sessionToken: session.sessionToken,
      csrfToken: session.csrfToken,
      expiresAt: session.expiresAt,
    });

    await writeAuditLog({
      actorId: user.id,
      action: "LOGIN_SUCCESS",
      entityType: "auth",
      entityId: session.sessionId,
      ipMasked,
      userAgent,
    });

    return response;
  } catch (error) {
    return fromUnknownError(error);
  }
}
