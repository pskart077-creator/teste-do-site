import type { NextRequest } from "next/server";
import { fromUnknownError, ok, parseJsonBody } from "@/lib/admin-interno/api";
import { requireInternalApiSession } from "@/lib/admin-interno/auth";
import { createCrmDeal, listCrmDeals } from "@/lib/admin-interno/crm";
import { crmDealCreateSchema, crmDealQuerySchema } from "@/lib/admin-interno/validators";

export async function GET(request: NextRequest) {
  try {
    await requireInternalApiSession(request, {
      permission: "crm:read",
    });

    const params = request.nextUrl.searchParams;
    const query = crmDealQuerySchema.parse({
      stage: params.get("stage") ?? undefined,
      ownerId: params.get("ownerId") ?? undefined,
      q: params.get("q") ?? undefined,
      limit: params.get("limit") ?? undefined,
    });

    const result = await listCrmDeals(query);
    return ok(result);
  } catch (error) {
    return fromUnknownError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireInternalApiSession(request, {
      permission: "crm:manage",
      requireCsrf: true,
    });

    const body = crmDealCreateSchema.parse(await parseJsonBody(request, 100_000));
    const deal = await createCrmDeal(session.userId, body);

    return ok({
      deal,
    });
  } catch (error) {
    return fromUnknownError(error);
  }
}
