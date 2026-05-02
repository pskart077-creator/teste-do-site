import { NewsAuditAction, Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";

export type AuditPayload = {
  action: NewsAuditAction;
  actorId?: string | null;
  entityType: string;
  entityId?: string | null;
  description?: string;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export function getRequestIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }

  const realIp = request.headers.get("x-real-ip");
  return realIp?.trim() || null;
}

export function getRequestUserAgent(request: NextRequest) {
  return request.headers.get("user-agent") || null;
}

export async function writeAuditLog(payload: AuditPayload) {
  try {
    const metadataValue =
      payload.metadata === null
        ? Prisma.JsonNull
        : (payload.metadata as Prisma.InputJsonValue | undefined);

    await prisma.newsAuditLog.create({
      data: {
        action: payload.action,
        actorId: payload.actorId ?? null,
        entityType: payload.entityType,
        entityId: payload.entityId ?? null,
        description: payload.description,
        metadata: metadataValue,
        ipAddress: payload.ipAddress ?? null,
        userAgent: payload.userAgent ?? null,
      },
    });
  } catch {
    // Audit logging must never break the request lifecycle.
  }
}
