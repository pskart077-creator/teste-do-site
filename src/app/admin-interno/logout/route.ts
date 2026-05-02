import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  clearInternalSessionCookies,
  getInternalAuthFromRequest,
  revokeInternalSessionByToken,
} from "@/lib/admin-interno/auth";
import { writeAuditLog } from "@/lib/admin-interno/audit";
import { INTERNAL_ADMIN_SESSION_COOKIE } from "@/lib/admin-interno/constants";
import {
  applyAdminSecurityHeaders,
  getRequestIp,
  getUserAgent,
  requireTrustedOrigin,
} from "@/lib/admin-interno/http";
import { maskIpAddress } from "@/lib/admin-interno/sanitize";

export async function POST(request: NextRequest) {
  const ipMasked = maskIpAddress(getRequestIp(request));
  const userAgent = getUserAgent(request).slice(0, 500);

  try {
    requireTrustedOrigin(request);
  } catch {
    const forbidden = NextResponse.redirect(new URL("/admin-interno/login", request.url), 303);
    clearInternalSessionCookies(forbidden);
    return applyAdminSecurityHeaders(forbidden);
  }

  const session = await getInternalAuthFromRequest(request);
  const token = request.cookies.get(INTERNAL_ADMIN_SESSION_COOKIE)?.value;
  await revokeInternalSessionByToken(token, "manual_logout");

  if (session) {
    await writeAuditLog({
      actorId: session.userId,
      action: "LOGOUT",
      entityType: "auth",
      entityId: session.sessionId,
      ipMasked,
      userAgent,
    });
  }

  const response = NextResponse.redirect(new URL("/admin-interno/login", request.url), 303);
  clearInternalSessionCookies(response);
  return applyAdminSecurityHeaders(response);
}
