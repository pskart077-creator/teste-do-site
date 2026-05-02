import type { NextRequest } from "next/server";
import { fromUnknownError, ok, parseJsonBody } from "@/lib/admin-interno/api";
import { requireInternalApiSession } from "@/lib/admin-interno/auth";
import { updateCrmTask } from "@/lib/admin-interno/crm";
import { crmTaskUpdateSchema } from "@/lib/admin-interno/validators";

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{ id: string; taskId: string }>;
  },
) {
  try {
    const session = await requireInternalApiSession(request, {
      permission: "crm:manage",
      requireCsrf: true,
    });

    const { id, taskId } = await context.params;
    const body = crmTaskUpdateSchema.parse(await parseJsonBody(request, 60_000));
    const task = await updateCrmTask(session.userId, id, taskId, body);

    return ok({
      task,
    });
  } catch (error) {
    return fromUnknownError(error);
  }
}
