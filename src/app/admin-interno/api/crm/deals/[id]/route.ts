import type { NextRequest } from "next/server";
import { fromUnknownError, ok, parseJsonBody } from "@/lib/admin-interno/api";
import { requireInternalApiSession } from "@/lib/admin-interno/auth";
import { updateCrmDeal } from "@/lib/admin-interno/crm";
import { crmDealUpdateSchema } from "@/lib/admin-interno/validators";

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const session = await requireInternalApiSession(request, {
      permission: "crm:manage",
      requireCsrf: true,
    });

    const { id } = await context.params;
    const body = crmDealUpdateSchema.parse(await parseJsonBody(request, 100_000));
    const deal = await updateCrmDeal(session.userId, id, body);

    return ok({
      deal,
    });
  } catch (error) {
    return fromUnknownError(error);
  }
}
