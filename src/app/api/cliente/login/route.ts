import type { NextRequest } from "next/server";
import { ApiError, fromUnknownError, ok, parseJsonBody } from "@/lib/news/api";
import { getRequestIp, getUserAgent, requireRateLimit } from "@/lib/news/http";
import {
  authenticateCreditCustomer,
  createCreditClientSession,
  persistCreditClientSessionCookie,
} from "@/lib/credit/auth";

export async function POST(request: NextRequest) {
  try {
    const ip = getRequestIp(request);
    requireRateLimit(`client-login:${ip}`, { limit: 20, windowMs: 10 * 60_000 });

    const body = await parseJsonBody<{
      email: string;
      password: string;
    }>(request, 30_000);

    const user = await authenticateCreditCustomer(body.email, body.password);
    if (!user) {
      throw new ApiError(401, "INVALID_CREDENTIALS", "E-mail ou senha inválidos.");
    }

    const session = await createCreditClientSession({
      userId: user.id,
      ipAddress: ip,
      userAgent: getUserAgent(request),
    });
    await persistCreditClientSessionCookie(session.token, session.expiresAt);

    return ok({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    return fromUnknownError(error);
  }
}
