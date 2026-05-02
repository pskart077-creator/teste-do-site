import type { InternalAuditAction } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

type AuditInput = {
  actorId?: string | null;
  action: InternalAuditAction;
  entityType: string;
  entityId?: string | null;
  context?: Record<string, unknown> | null;
  ipMasked?: string | null;
  userAgent?: string | null;
};

export async function writeAuditLog(input: AuditInput) {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      context: input.context
        ? (input.context as unknown as Prisma.InputJsonValue)
        : undefined,
      ipMasked: input.ipMasked ?? null,
      userAgent: input.userAgent ?? null,
    },
  });
}
