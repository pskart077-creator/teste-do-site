import type { NextRequest } from "next/server";
import { fromUnknownError, ok, parseJsonBody } from "@/lib/admin-interno/api";
import { requireInternalApiSession } from "@/lib/admin-interno/auth";
import { addCrmTask } from "@/lib/admin-interno/crm";
import { crmTaskCreateSchema } from "@/lib/admin-interno/validators";

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
    const body = crmTaskCreateSchema.parse(await parseJsonBody(request, 60_000));
    const task = await addCrmTask(session.userId, id, body);

    return ok({
      task,
    });
  } catch (error) {
    return fromUnknownError(error);
  }
}
