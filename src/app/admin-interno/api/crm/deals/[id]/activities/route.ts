import type { NextRequest } from "next/server";
import { fromUnknownError, ok, parseJsonBody } from "@/lib/admin-interno/api";
import { requireInternalApiSession } from "@/lib/admin-interno/auth";
import { addCrmActivity } from "@/lib/admin-interno/crm";
import { crmActivityCreateSchema } from "@/lib/admin-interno/validators";

export async function POST(
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
    const body = crmActivityCreateSchema.parse(await parseJsonBody(request, 60_000));
    const activity = await addCrmActivity(session.userId, id, body);

    return ok({
      activity,
    });
  } catch (error) {
    return fromUnknownError(error);
  }
}
