import type { NextRequest } from "next/server";
import { fromUnknownError, InternalApiError, ok, parseJsonBody } from "@/lib/admin-interno/api";
import { requireInternalApiSession } from "@/lib/admin-interno/auth";
import { writeAuditLog } from "@/lib/admin-interno/audit";
import { sanitizeText } from "@/lib/admin-interno/sanitize";
import { notificationRecipientUpdateSchema } from "@/lib/admin-interno/validators";
import { prisma } from "@/lib/db/prisma";

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const session = await requireInternalApiSession(request, {
      permission: "settings:manage",
      requireCsrf: true,
    });

    const { id } = await context.params;
    const body = notificationRecipientUpdateSchema.parse(await parseJsonBody(request));

    const exists = await prisma.notificationRecipient.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!exists) {
      throw new InternalApiError(404, "RECIPIENT_NOT_FOUND", "Destinatario não encontrado.");
    }

    const updated = await prisma.notificationRecipient.update({
      where: {
        id,
      },
      data: {
        fullName: body.fullName ? sanitizeText(body.fullName, 120) : undefined,
        isActive: body.isActive,
      },
    });

    await writeAuditLog({
      actorId: session.userId,
      action: "RECIPIENT_UPDATED",
      entityType: "notification_recipient",
      entityId: id,
      context: {
        changedName: body.fullName ? true : false,
        changedStatus: typeof body.isActive === "boolean",
      },
    });

    return ok({ recipient: updated });
  } catch (error) {
    return fromUnknownError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const session = await requireInternalApiSession(request, {
      permission: "settings:manage",
      requireCsrf: true,
    });

    const { id } = await context.params;

    const updated = await prisma.notificationRecipient.updateMany({
      where: {
        id,
        deletedAt: null,
      },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    if (!updated.count) {
      throw new InternalApiError(404, "RECIPIENT_NOT_FOUND", "Destinatario não encontrado.");
    }

    await writeAuditLog({
      actorId: session.userId,
      action: "RECIPIENT_DELETED",
      entityType: "notification_recipient",
      entityId: id,
    });

    return ok({ deleted: true });
  } catch (error) {
    return fromUnknownError(error);
  }
}
