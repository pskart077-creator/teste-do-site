import type { NextRequest } from "next/server";
import { fromUnknownError, InternalApiError, ok } from "@/lib/admin-interno/api";
import { requireInternalApiSession } from "@/lib/admin-interno/auth";
import { writeAuditLog } from "@/lib/admin-interno/audit";
import { getLeadById, updateLead } from "@/lib/admin-interno/leads";
import { hasPermission } from "@/lib/admin-interno/permissions";
import { leadUpdateSchema } from "@/lib/admin-interno/validators";

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const session = await requireInternalApiSession(request, {
      permission: "leads:read",
    });

    const { id } = await context.params;
    const lead = await getLeadById(id);
    if (!lead) {
      throw new InternalApiError(404, "LEAD_NOT_FOUND", "Lead não encontrado.");
    }

    await writeAuditLog({
      actorId: session.userId,
      action: "LEAD_VIEWED",
      entityType: "lead",
      entityId: lead.id,
    });

    return ok(lead);
  } catch (error) {
    return fromUnknownError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const session = await requireInternalApiSession(request, {
      permission: "leads:update",
      requireCsrf: true,
    });

    const { id } = await context.params;
    const body = leadUpdateSchema.parse(await request.json());

    if (
      Object.prototype.hasOwnProperty.call(body, "assigneeId") &&
      !hasPermission(session.role, "leads:assign")
    ) {
      throw new InternalApiError(403, "FORBIDDEN", "Sem permissão para atribuir responsável.");
    }

    const lead = await updateLead(id, session.userId, body);
    if (!lead) {
      throw new InternalApiError(404, "LEAD_NOT_FOUND", "Lead não encontrado.");
    }

    return ok(lead);
  } catch (error) {
    return fromUnknownError(error);
  }
}
