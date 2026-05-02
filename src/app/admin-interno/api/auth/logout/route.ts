import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fromUnknownError } from "@/lib/admin-interno/api";
import {
  clearInternalSessionCookies,
  getInternalAuthFromRequest,
  revokeInternalSessionByToken,
} from "@/lib/admin-interno/auth";
import { writeAuditLog } from "@/lib/admin-interno/audit";
import { getRequestIp, getUserAgent, requireTrustedOrigin } from "@/lib/admin-interno/http";
import { INTERNAL_ADMIN_SESSION_COOKIE } from "@/lib/admin-interno/constants";
import { maskIpAddress } from "@/lib/admin-interno/sanitize";

export async function POST(request: NextRequest) {
  const ipMasked = maskIpAddress(getRequestIp(request));
  const userAgent = getUserAgent(request).slice(0, 500);

  try {
    requireTrustedOrigin(request);
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

    const response = NextResponse.json({
      success: true,
      data: {
        loggedOut: true,
      },
    });

    clearInternalSessionCookies(response);
    return response;
  } catch (error) {
    return fromUnknownError(error);
  }
}
