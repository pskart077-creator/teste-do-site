import type { NextRequest } from "next/server";
import { ApiError, fail, fromUnknownError, ok } from "@/lib/news/api";
import { processDueCardApprovalEmails } from "@/services/credit/sendCardApprovalEmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getJobSecret() {
  return (process.env.CREDPAGOS_EMAIL_JOB_SECRET ?? process.env.CRON_SECRET)?.trim();
}

function assertAuthorized(request: NextRequest) {
  const secret = getJobSecret();

  if (!secret) {
    return;
  }

  const authorization = request.headers.get("authorization")?.trim();
  const headerSecret = request.headers.get("x-cron-secret")?.trim();
  const bearerSecret = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : "";

  if (headerSecret === secret || bearerSecret === secret) {
    return;
  }

  throw new ApiError(401, "UNAUTHORIZED", "Processador de e-mails não autorizado.");
}

async function handle(request: NextRequest) {
  try {
    assertAuthorized(request);

    const rawLimit = request.nextUrl.searchParams.get("limit");
    const parsedLimit = rawLimit ? Number(rawLimit) : undefined;
    const result = await processDueCardApprovalEmails({
      baseUrl: request.nextUrl.origin,
      limit: parsedLimit,
    });

    return ok(result);
  } catch (error) {
    if (error instanceof ApiError) {
      return fail(error.status, error.code, error.message, error.details);
    }

    return fromUnknownError(error);
  }
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
