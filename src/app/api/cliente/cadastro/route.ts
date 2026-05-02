import type { NextRequest } from "next/server";
import { ApiError, fromUnknownError, ok, parseJsonBody } from "@/lib/news/api";
import { getRequestIp, getUserAgent, requireRateLimit } from "@/lib/news/http";
import {
  createCreditClientSession,
  createCreditCustomer,
  persistCreditClientSessionCookie,
} from "@/lib/credit/auth";

export async function POST(request: NextRequest) {
  try {
    const ip = getRequestIp(request);
    requireRateLimit(`client-signup:${ip}`, { limit: 12, windowMs: 10 * 60_000 });

    const body = await parseJsonBody<{
      name: string;
      email: string;
      phone: string;
      password: string;
    }>(request, 50_000);

    if (!body.name?.trim() || !body.email?.trim() || !body.password?.trim()) {
      throw new ApiError(400, "INVALID_PAYLOAD", "Informe nome, e-mail e senha.");
    }

    const user = await createCreditCustomer({
      name: body.name.trim(),
      email: body.email.trim(),
      phone: body.phone?.trim() ?? "",
      password: body.password,
    });

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
    }, { status: 201 });
  } catch (error) {
    return fromUnknownError(error);
  }
}
