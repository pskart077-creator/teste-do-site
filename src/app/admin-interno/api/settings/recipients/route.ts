import type { NextRequest } from "next/server";
import { fromUnknownError, ok, parseJsonBody } from "@/lib/admin-interno/api";
import { requireInternalApiSession } from "@/lib/admin-interno/auth";
import { writeAuditLog } from "@/lib/admin-interno/audit";
import { sanitizeEmail, sanitizeText } from "@/lib/admin-interno/sanitize";
import { notificationRecipientCreateSchema } from "@/lib/admin-interno/validators";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    await requireInternalApiSession(request, {
      permission: "settings:read",
    });

    const recipients = await prisma.notificationRecipient.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return ok({ recipients });
  } catch (error) {
    return fromUnknownError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireInternalApiSession(request, {
      permission: "settings:manage",
      requireCsrf: true,
    });

    const body = notificationRecipientCreateSchema.parse(await parseJsonBody(request));

    const recipient = await prisma.notificationRecipient.upsert({
      where: {
        email: sanitizeEmail(body.email),
      },
      update: {
        fullName: body.fullName ? sanitizeText(body.fullName, 120) : null,
        isActive: body.isActive ?? true,
        deletedAt: null,
      },
      create: {
        email: sanitizeEmail(body.email),
        fullName: body.fullName ? sanitizeText(body.fullName, 120) : null,
        isActive: body.isActive ?? true,
      },
    });

    await writeAuditLog({
      actorId: session.userId,
      action: "RECIPIENT_CREATED",
      entityType: "notification_recipient",
      entityId: recipient.id,
    });

    return ok({ recipient });
  } catch (error) {
    return fromUnknownError(error);
  }
}
