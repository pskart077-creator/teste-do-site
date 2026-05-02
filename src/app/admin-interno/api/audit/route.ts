import type { NextRequest } from "next/server";
import { fromUnknownError, ok } from "@/lib/admin-interno/api";
import { requireInternalApiSession } from "@/lib/admin-interno/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    await requireInternalApiSession(request, {
      permission: "audit:read",
    });

    const params = request.nextUrl.searchParams;
    const action = params.get("action") ?? undefined;
    const actorId = params.get("actorId") ?? undefined;
    const entityType = params.get("entityType") ?? undefined;
    const page = Math.max(1, Number(params.get("page") ?? "1"));
    const pageSize = Math.min(100, Math.max(1, Number(params.get("pageSize") ?? "25")));

    const from = params.get("from") ? new Date(params.get("from") as string) : null;
    const to = params.get("to") ? new Date(params.get("to") as string) : null;

    const where = {
      ...(action ? { action: action as never } : {}),
      ...(actorId ? { actorId } : {}),
      ...(entityType ? { entityType } : {}),
      ...((from || to)
        ? {
            createdAt: {
              ...(from && !Number.isNaN(from.getTime()) ? { gte: from } : {}),
              ...(to && !Number.isNaN(to.getTime()) ? { lte: to } : {}),
            },
          }
        : {}),
    };

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return ok({
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      logs,
    });
  } catch (error) {
    return fromUnknownError(error);
  }
}
